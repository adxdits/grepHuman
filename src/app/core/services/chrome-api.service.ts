import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  ChromeTabInfo
} from '../models/content-analysis.model';

/**
 * Service for interacting with Chrome Extension APIs
 * Provides a type-safe abstraction over the chrome.* APIs
 */
@Injectable({
  providedIn: 'root'
})
export class ChromeApiService {
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * Check if running in a browser context with Chrome APIs available
   */
  get isExtensionContext(): boolean {
    return (
      isPlatformBrowser(this.platformId) &&
      typeof chrome !== 'undefined' &&
      !!chrome.runtime?.id
    );
  }

  /**
   * Get the currently active tab information
   */
  async getCurrentTab(): Promise<ChromeTabInfo | null> {
    if (!this.isExtensionContext) {
      return this.getMockTabInfo();
    }

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });

      if (!tab?.id || !tab.url) {
        return null;
      }

      return {
        id: tab.id,
        url: tab.url,
        title: tab.title ?? '',
        favIconUrl: tab.favIconUrl ?? null
      };
    } catch (error) {
      console.error('[ChromeApiService] Failed to get current tab:', error);
      return null;
    }
  }

  /**
   * Send a message to the content script in the specified tab.
   * If the content script is not yet loaded, injects it and retries once.
   */
  async sendMessageToTab<T = Record<string, unknown>>(
    tabId: number,
    message: Record<string, unknown>
  ): Promise<T | null> {
    if (!this.isExtensionContext) {
      return null;
    }

    try {
      const response = await chrome.tabs.sendMessage(tabId, message);
      return response as T;
    } catch {
      // Content script may not be loaded yet — inject and retry
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['content-script.js']
        });
        // Small delay to let the content script initialize
        await new Promise(resolve => setTimeout(resolve, 150));
        const retryResponse = await chrome.tabs.sendMessage(tabId, message);
        return retryResponse as T;
      } catch (retryError) {
        console.error('[ChromeApiService] Failed to send message to tab after injection:', retryError);
        return null;
      }
    }
  }

  /**
   * Store data in Chrome's local storage
   */
  async setStorageData<T>(key: string, data: T): Promise<void> {
    if (!this.isExtensionContext) {
      localStorage.setItem(key, JSON.stringify(data));
      return;
    }

    await chrome.storage.local.set({ [key]: data });
  }

  /**
   * Retrieve data from Chrome's local storage
   */
  async getStorageData<T>(key: string): Promise<T | null> {
    if (!this.isExtensionContext) {
      const data = localStorage.getItem(key);
      return data ? (JSON.parse(data) as T) : null;
    }

    const result = await chrome.storage.local.get(key);
    return (result[key] as T) ?? null;
  }

  /**
   * Mock tab info for development outside extension context
   */
  private getMockTabInfo(): ChromeTabInfo {
    return {
      id: 1,
      url: 'https://www.google.com/search?q=test',
      title: 'test - Google Search',
      favIconUrl: null
    };
  }
}
