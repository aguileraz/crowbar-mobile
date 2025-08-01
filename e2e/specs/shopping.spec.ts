/**
 * Shopping Flow E2E Tests
 */

import { expect } from 'chai'
import { LoginPage } from '../pages/login.page'
import { HomePage } from '../pages/home.page'
import { TestUtils } from '../helpers/utils'
import { Gestures } from '../helpers/gestures'

describe('Shopping Flow Tests', () => {
  let loginPage: LoginPage
  let homePage: HomePage

  before(async () => {
    loginPage = new LoginPage()
    homePage = new HomePage()
    
    // Login once for all shopping tests
    await TestUtils.clearAppData()
    await TestUtils.restartApp()
    await loginPage.login('test@crowbar.com', 'Test123!')
    await driver.pause(3000)
  })

  describe('Browse Mystery Boxes', () => {
    it('should display mystery boxes on home page', async () => {
      expect(await homePage.isLoaded()).to.be.true
      
      const boxCount = await homePage.getMysteryBoxCount()
      expect(boxCount).to.be.greaterThan(0)
    })

    it('should search for mystery boxes', async () => {
      await homePage.searchMysteryBoxes('electronics')
      await driver.pause(2000)
      
      const searchResults = await homePage.getMysteryBoxCount()
      expect(searchResults).to.be.greaterThan(0)
      
      // Clear search
      const searchBar = await $(homePage.searchBar)
      await searchBar.clearValue()
      await homePage.hideKeyboard()
    })

    it('should filter mystery boxes by category', async () => {
      await homePage.selectCategory('Electronics')
      await driver.pause(2000)
      
      const filteredCount = await homePage.getMysteryBoxCount()
      expect(filteredCount).to.be.greaterThan(0)
    })

    it('should load more boxes on scroll', async () => {
      const initialCount = await homePage.getMysteryBoxCount()
      
      await homePage.loadMore()
      
      const newCount = await homePage.getMysteryBoxCount()
      expect(newCount).to.be.greaterThan(initialCount)
    })
  })

  describe('Mystery Box Details', () => {
    it('should view mystery box details', async () => {
      await homePage.selectMysteryBox(0)
      await driver.pause(2000)
      
      // Verify details page elements
      const boxTitle = await $('~box-title')
      expect(await boxTitle.isDisplayed()).to.be.true
      
      const boxPrice = await $('~box-price')
      expect(await boxPrice.isDisplayed()).to.be.true
      
      const boxDescription = await $('~box-description')
      expect(await boxDescription.isDisplayed()).to.be.true
    })

    it('should view seller information', async () => {
      const sellerInfo = await $('~seller-info')
      await sellerInfo.click()
      await driver.pause(1000)
      
      const sellerName = await $('~seller-name')
      expect(await sellerName.isDisplayed()).to.be.true
      
      const sellerRating = await $('~seller-rating')
      expect(await sellerRating.isDisplayed()).to.be.true
    })

    it('should view box contents preview', async () => {
      const contentsSection = await Gestures.scrollToElement('~contents-preview')
      expect(contentsSection).to.not.be.null
      
      if (contentsSection) {
        await contentsSection.click()
        await driver.pause(1000)
        
        const contentsList = await $$('~content-item')
        expect(contentsList.length).to.be.greaterThan(0)
      }
    })
  })

  describe('Add to Cart', () => {
    it('should add mystery box to cart', async () => {
      const initialCartCount = await homePage.getCartItemCount()
      
      const addToCartButton = await $('~add-to-cart-button')
      await addToCartButton.click()
      await driver.pause(2000)
      
      // Go back to home
      await driver.back()
      await driver.pause(1000)
      
      const newCartCount = await homePage.getCartItemCount()
      expect(newCartCount).to.equal(initialCartCount + 1)
    })

    it('should view cart contents', async () => {
      await homePage.goToCart()
      await driver.pause(2000)
      
      const cartItems = await $$('~cart-item')
      expect(cartItems.length).to.be.greaterThan(0)
      
      const cartTotal = await $('~cart-total')
      expect(await cartTotal.isDisplayed()).to.be.true
    })

    it('should update quantity in cart', async () => {
      const quantityInput = await $('~quantity-input-0')
      await quantityInput.clearValue()
      await quantityInput.setValue('2')
      await driver.pause(1000)
      
      const itemTotal = await $('~item-total-0')
      const totalText = await itemTotal.getText()
      expect(totalText).to.include('R$') // Brazilian currency
    })

    it('should remove item from cart', async () => {
      const removeButton = await $('~remove-item-0')
      await removeButton.click()
      
      // Confirm removal
      const confirmButton = await $('~confirm-remove')
      await confirmButton.click()
      await driver.pause(2000)
      
      const emptyCartMessage = await $('~empty-cart-message')
      expect(await emptyCartMessage.isDisplayed()).to.be.true
    })
  })

  describe('Checkout Process', () => {
    before(async () => {
      // Add item to cart for checkout
      await driver.back() // Go back to home
      await driver.pause(1000)
      await homePage.selectMysteryBox(0)
      await driver.pause(2000)
      
      const addToCartButton = await $('~add-to-cart-button')
      await addToCartButton.click()
      await driver.pause(2000)
      
      await homePage.goToCart()
      await driver.pause(2000)
    })

    it('should proceed to checkout', async () => {
      const checkoutButton = await $('~checkout-button')
      await checkoutButton.click()
      await driver.pause(2000)
      
      const checkoutTitle = await $('~checkout-title')
      expect(await checkoutTitle.isDisplayed()).to.be.true
    })

    it('should select delivery address', async () => {
      const addressList = await $$('~address-item')
      
      if (addressList.length === 0) {
        // Add new address
        const addAddressButton = await $('~add-address-button')
        await addAddressButton.click()
        await driver.pause(2000)
        
        // Fill address form
        await TestUtils.waitAndSetValue('~address-street', 'Rua Teste 123')
        await TestUtils.waitAndSetValue('~address-city', 'São Paulo')
        await TestUtils.waitAndSetValue('~address-state', 'SP')
        await TestUtils.waitAndSetValue('~address-zip', '01234-567')
        
        const saveAddressButton = await $('~save-address-button')
        await saveAddressButton.click()
        await driver.pause(2000)
      } else {
        // Select existing address
        await addressList[0].click()
      }
      
      const selectedAddress = await $('~selected-address')
      expect(await selectedAddress.isDisplayed()).to.be.true
    })

    it('should select payment method', async () => {
      const paymentMethods = await $$('~payment-method')
      expect(paymentMethods.length).to.be.greaterThan(0)
      
      // Select credit card
      const creditCardOption = await $('~payment-credit-card')
      await creditCardOption.click()
      await driver.pause(1000)
      
      const selectedPayment = await $('~selected-payment')
      expect(await selectedPayment.isDisplayed()).to.be.true
    })

    it('should review order summary', async () => {
      await Gestures.scrollToElement('~order-summary')
      
      const subtotal = await $('~order-subtotal')
      expect(await subtotal.isDisplayed()).to.be.true
      
      const shipping = await $('~order-shipping')
      expect(await shipping.isDisplayed()).to.be.true
      
      const total = await $('~order-total')
      expect(await total.isDisplayed()).to.be.true
    })

    it('should place order successfully', async () => {
      const placeOrderButton = await $('~place-order-button')
      await placeOrderButton.click()
      await driver.pause(3000)
      
      // Should see order confirmation
      const confirmationTitle = await $('~order-confirmation-title')
      expect(await confirmationTitle.isDisplayed()).to.be.true
      
      const orderNumber = await $('~order-number')
      const orderNumberText = await orderNumber.getText()
      expect(orderNumberText).to.match(/^#\d+$/)
      
      // Take screenshot of confirmation
      await TestUtils.takeScreenshot('order-confirmation')
    })
  })

  describe('Mystery Box Opening', () => {
    it('should navigate to mystery box opening', async () => {
      const openBoxButton = await $('~open-box-button')
      await openBoxButton.click()
      await driver.pause(2000)
      
      const openingScreen = await $('~box-opening-screen')
      expect(await openingScreen.isDisplayed()).to.be.true
    })

    it('should play opening animation', async () => {
      const boxContainer = await $('~box-container')
      expect(await boxContainer.isDisplayed()).to.be.true
      
      // Tap to open
      await boxContainer.click()
      await driver.pause(3000) // Wait for animation
      
      const revealedItems = await $$('~revealed-item')
      expect(revealedItems.length).to.be.greaterThan(0)
    })

    it('should share opening results', async () => {
      const shareButton = await $('~share-button')
      await shareButton.click()
      await driver.pause(1000)
      
      // Should show share options
      const shareSheet = await $('~share-sheet')
      expect(await shareSheet.isDisplayed()).to.be.true
      
      // Cancel share
      await driver.back()
    })
  })

  afterEach(async () => {
    if (this.currentTest?.state === 'failed') {
      await TestUtils.takeScreenshot(`failed-${this.currentTest.title}`)
    }
  })
})