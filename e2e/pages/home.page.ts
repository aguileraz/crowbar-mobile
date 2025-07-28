/**
 * Home Page Object
 */

import { BasePage } from './base.page'
import { TestUtils } from '../helpers/utils'
import { Gestures } from '../helpers/gestures'

export class HomePage extends BasePage {
  /**
   * Selectors
   */
  get searchBar() {
    return '~search-bar'
  }

  get featuredSection() {
    return '~featured-section'
  }

  get categoriesSection() {
    return '~categories-section'
  }

  get mysteryBoxCard() {
    return '//android.view.ViewGroup[@content-desc="mystery-box-card"]'
  }

  get cartIcon() {
    return '~cart-icon'
  }

  get cartBadge() {
    return '~cart-badge'
  }

  get profileIcon() {
    return '~profile-icon'
  }

  get notificationIcon() {
    return '~notification-icon'
  }

  get filterButton() {
    return '~filter-button'
  }

  get sortButton() {
    return '~sort-button'
  }

  /**
   * Check if home page is loaded
   */
  async isLoaded(): Promise<boolean> {
    await this.waitForPageLoad()
    return await TestUtils.elementExists(this.searchBar)
  }

  /**
   * Search for mystery boxes
   */
  async searchMysteryBoxes(query: string): Promise<void> {
    await TestUtils.waitAndClick(this.searchBar)
    await TestUtils.waitAndSetValue(this.searchBar, query)
    await this.hideKeyboard()
    await driver.pause(1000) // Wait for search results
  }

  /**
   * Get number of mystery boxes displayed
   */
  async getMysteryBoxCount(): Promise<number> {
    const boxes = await $$(this.mysteryBoxCard)
    return boxes.length
  }

  /**
   * Select mystery box by index
   */
  async selectMysteryBox(index: number = 0): Promise<void> {
    const boxes = await $$(this.mysteryBoxCard)
    if (boxes[index]) {
      await boxes[index].click()
    }
  }

  /**
   * Navigate to cart
   */
  async goToCart(): Promise<void> {
    await TestUtils.waitAndClick(this.cartIcon)
  }

  /**
   * Get cart item count
   */
  async getCartItemCount(): Promise<number> {
    const badge = await TestUtils.getElementText(this.cartBadge)
    return parseInt(badge, 10) || 0
  }

  /**
   * Navigate to profile
   */
  async goToProfile(): Promise<void> {
    await TestUtils.waitAndClick(this.profileIcon)
  }

  /**
   * Navigate to notifications
   */
  async goToNotifications(): Promise<void> {
    await TestUtils.waitAndClick(this.notificationIcon)
  }

  /**
   * Open filter options
   */
  async openFilters(): Promise<void> {
    await TestUtils.waitAndClick(this.filterButton)
  }

  /**
   * Open sort options
   */
  async openSort(): Promise<void> {
    await TestUtils.waitAndClick(this.sortButton)
  }

  /**
   * Select category
   */
  async selectCategory(categoryName: string): Promise<void> {
    const categorySelector = `~category-${categoryName.toLowerCase()}`
    const element = await Gestures.scrollToElement(categorySelector)
    if (element) {
      await element.click()
    }
  }

  /**
   * Refresh home page
   */
  async refresh(): Promise<void> {
    await this.pullToRefresh()
    await this.waitForPageLoad()
  }

  /**
   * Load more mystery boxes
   */
  async loadMore(): Promise<void> {
    await this.scrollToBottom()
    await driver.pause(2000) // Wait for lazy loading
  }

  /**
   * Check if featured section is visible
   */
  async isFeaturedSectionVisible(): Promise<boolean> {
    return await TestUtils.elementExists(this.featuredSection)
  }

  /**
   * Check if categories section is visible
   */
  async isCategoriesSectionVisible(): Promise<boolean> {
    return await TestUtils.elementExists(this.categoriesSection)
  }
}