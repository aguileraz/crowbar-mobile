 
/**
 * Testes E2E para carrinho e checkout
 * 
 * Testa todo o fluxo de adicionar ao carrinho, gerenciar itens
 * e finalizar compra.
 */

import { 
  TEST_IDS, 
  TEST_BOXES, 
  TEST_ADDRESSES, 
  TEST_CARDS,
  EXPECTED_TEXTS 
} from '../../helpers/testData';
import { 
  login, 
  navigateToBoxes,
  navigateToCart,
  addBoxToCart,
  removeFromCart,
  clearCart,
  fillAddressForm,
  fillPaymentForm,
  expectVisible
} from '../../helpers/actions';

describe('Cart and Checkout Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true });
    await login();
  });

  beforeEach(async () => {
    // Limpar carrinho antes de cada teste
    await clearCart();
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  it('deve adicionar item ao carrinho', async () => {
    logTest('Teste: Adicionar ao carrinho');
    
    // Navegar para caixas
    await navigateToBoxes();
    
    // Adicionar caixa ao carrinho
    await addBoxToCart(TEST_BOXES.BASIC_BOX.name);
    
    // Navegar para carrinho
    await navigateToCart();
    
    // Verificar que item está no carrinho
    await waitForElement(element(by.text(TEST_BOXES.BASIC_BOX.name)));
    await expectVisible(TEST_IDS.CART.ITEM);
    
    // Verificar total
    await expect(element(by.id(TEST_IDS.CART.TOTAL))).toHaveText(`R$ ${TEST_BOXES.BASIC_BOX.price.toFixed(2).replace('.', ',')}`);
    
    logTest('Item adicionado ao carrinho com sucesso');
  });

  it('deve mostrar badge com quantidade no ícone do carrinho', async () => {
    logTest('Teste: Badge de quantidade no carrinho');
    
    // Navegar para caixas
    await navigateToBoxes();
    
    // Adicionar primeira caixa
    await addBoxToCart(TEST_BOXES.BASIC_BOX.name);
    
    // Verificar badge
    await expect(element(by.id('cart-badge'))).toHaveText('1');
    
    // Adicionar segunda caixa
    await element(by.id('header-back-button')).tap(); // Voltar para lista
    await addBoxToCart(TEST_BOXES.PREMIUM_BOX.name);
    
    // Verificar badge atualizado
    await expect(element(by.id('cart-badge'))).toHaveText('2');
    
    logTest('Badge de quantidade funcionando');
  });

  it('deve alterar quantidade de itens no carrinho', async () => {
    logTest('Teste: Alterar quantidade de itens');
    
    // Adicionar item
    await navigateToBoxes();
    await addBoxToCart(TEST_BOXES.BASIC_BOX.name);
    await navigateToCart();
    
    // Aumentar quantidade
    await waitAndTap(element(by.id('cart-item-increase')).atIndex(0));
    await sleep(500);
    
    // Verificar quantidade e total
    await expect(element(by.id(TEST_IDS.CART.QUANTITY)).atIndex(0)).toHaveText('2');
    const expectedTotal = (TEST_BOXES.BASIC_BOX.price * 2).toFixed(2).replace('.', ',');
    await expect(element(by.id(TEST_IDS.CART.TOTAL))).toHaveText(`R$ ${expectedTotal}`);
    
    // Diminuir quantidade
    await waitAndTap(element(by.id('cart-item-decrease')).atIndex(0));
    await sleep(500);
    
    // Verificar volta para 1
    await expect(element(by.id(TEST_IDS.CART.QUANTITY)).atIndex(0)).toHaveText('1');
    
    logTest('Alteração de quantidade funcionando');
  });

  it('deve remover item do carrinho', async () => {
    logTest('Teste: Remover item do carrinho');
    
    // Adicionar item
    await navigateToBoxes();
    await addBoxToCart(TEST_BOXES.BASIC_BOX.name);
    await navigateToCart();
    
    // Remover item
    await removeFromCart(0);
    
    // Verificar carrinho vazio
    await expectVisible(TEST_IDS.CART.EMPTY_MESSAGE);
    await expect(element(by.id(TEST_IDS.CART.EMPTY_MESSAGE))).toHaveText(EXPECTED_TEXTS.CART.empty);
    
    logTest('Remoção de item funcionando');
  });

  it('deve calcular subtotal, frete e total corretamente', async () => {
    logTest('Teste: Cálculo de valores');
    
    // Adicionar múltiplos itens
    await navigateToBoxes();
    await addBoxToCart(TEST_BOXES.BASIC_BOX.name);
    await element(by.id('header-back-button')).tap();
    await addBoxToCart(TEST_BOXES.PREMIUM_BOX.name);
    
    // Ir para carrinho
    await navigateToCart();
    
    // Verificar valores
    const subtotal = TEST_BOXES.BASIC_BOX.price + TEST_BOXES.PREMIUM_BOX.price;
    await expect(element(by.id('cart-subtotal'))).toHaveText(`R$ ${subtotal.toFixed(2).replace('.', ',')}`);
    
    // Verificar se tem frete
    await expectVisible('cart-shipping');
    
    // Verificar total (subtotal + frete)
    await expectVisible(TEST_IDS.CART.TOTAL);
    
    logTest('Cálculos de valores funcionando');
  });

  it('deve aplicar cupom de desconto', async () => {
    logTest('Teste: Cupom de desconto');
    
    // Adicionar item
    await navigateToBoxes();
    await addBoxToCart(TEST_BOXES.BASIC_BOX.name);
    await navigateToCart();
    
    // Abrir campo de cupom
    await waitAndTap(element(by.text('Adicionar cupom')));
    
    // Inserir cupom
    await waitAndType(element(by.id('coupon-input')), 'TESTE10');
    await waitAndTap(element(by.text('Aplicar')));
    
    // Verificar desconto aplicado
    await waitForElement(element(by.text('Cupom aplicado!')));
    await expectVisible('cart-discount');
    await expect(element(by.id('cart-discount-value'))).toHaveText('-R$ 4,99'); // 10% de desconto
    
    logTest('Cupom de desconto funcionando');
  });

  it('deve prosseguir para checkout', async () => {
    logTest('Teste: Prosseguir para checkout');
    
    // Adicionar item
    await navigateToBoxes();
    await addBoxToCart(TEST_BOXES.BASIC_BOX.name);
    await navigateToCart();
    
    // Prosseguir para checkout
    await waitAndTap(element(by.id(TEST_IDS.CART.CHECKOUT_BUTTON)));
    
    // Verificar que está no checkout
    await waitForScreen(TEST_IDS.CHECKOUT.ADDRESS_SECTION);
    await expect(element(by.text(EXPECTED_TEXTS.CHECKOUT.title))).toBeVisible();
    
    logTest('Navegação para checkout funcionando');
  });

  it('deve preencher endereço de entrega', async () => {
    logTest('Teste: Preencher endereço de entrega');
    
    // Preparar carrinho e ir para checkout
    await navigateToBoxes();
    await addBoxToCart(TEST_BOXES.BASIC_BOX.name);
    await navigateToCart();
    await waitAndTap(element(by.id(TEST_IDS.CART.CHECKOUT_BUTTON)));
    
    // Preencher endereço
    await fillAddressForm(TEST_ADDRESSES.VALID_ADDRESS);
    
    // Verificar que campos foram preenchidos automaticamente
    await expect(element(by.id('checkout-street-input'))).toHaveText(TEST_ADDRESSES.VALID_ADDRESS.street);
    await expect(element(by.id('checkout-neighborhood-input'))).toHaveText(TEST_ADDRESSES.VALID_ADDRESS.neighborhood);
    await expect(element(by.id('checkout-city-input'))).toHaveText(TEST_ADDRESSES.VALID_ADDRESS.city);
    
    logTest('Preenchimento de endereço funcionando');
  });

  it('deve validar CEP inválido', async () => {
    logTest('Teste: Validar CEP inválido');
    
    // Preparar checkout
    await navigateToBoxes();
    await addBoxToCart(TEST_BOXES.BASIC_BOX.name);
    await navigateToCart();
    await waitAndTap(element(by.id(TEST_IDS.CART.CHECKOUT_BUTTON)));
    
    // Tentar CEP inválido
    await waitAndType(element(by.id(TEST_IDS.CHECKOUT.CEP_INPUT)), '00000-000');
    await element(by.id(TEST_IDS.CHECKOUT.NUMBER_INPUT)).tap(); // Sair do campo
    
    // Verificar erro
    await waitForElement(element(by.text('CEP não encontrado')));
    
    logTest('Validação de CEP funcionando');
  });

  it('deve preencher dados de pagamento', async () => {
    logTest('Teste: Preencher dados de pagamento');
    
    // Preparar checkout
    await navigateToBoxes();
    await addBoxToCart(TEST_BOXES.BASIC_BOX.name);
    await navigateToCart();
    await waitAndTap(element(by.id(TEST_IDS.CART.CHECKOUT_BUTTON)));
    
    // Preencher endereço
    await fillAddressForm(TEST_ADDRESSES.VALID_ADDRESS);
    
    // Ir para pagamento
    await waitAndTap(element(by.text('Continuar para Pagamento')));
    
    // Preencher cartão
    await fillPaymentForm(TEST_CARDS.VALID_CARD);
    
    // Verificar formatação do cartão
    await expect(element(by.id(TEST_IDS.CHECKOUT.CARD_NUMBER_INPUT))).toHaveText('4111 1111 1111 1111');
    
    logTest('Preenchimento de pagamento funcionando');
  });

  it('deve validar cartão inválido', async () => {
    logTest('Teste: Validar cartão inválido');
    
    // Preparar checkout com pagamento
    await navigateToBoxes();
    await addBoxToCart(TEST_BOXES.BASIC_BOX.name);
    await navigateToCart();
    await waitAndTap(element(by.id(TEST_IDS.CART.CHECKOUT_BUTTON)));
    await fillAddressForm(TEST_ADDRESSES.VALID_ADDRESS);
    await waitAndTap(element(by.text('Continuar para Pagamento')));
    
    // Tentar cartão inválido
    await waitAndType(element(by.id(TEST_IDS.CHECKOUT.CARD_NUMBER_INPUT)), '1234567890123456');
    await element(by.id(TEST_IDS.CHECKOUT.CARD_NAME_INPUT)).tap();
    
    // Verificar erro
    await waitForElement(element(by.text('Número de cartão inválido')));
    
    logTest('Validação de cartão funcionando');
  });

  it('deve exibir resumo do pedido', async () => {
    logTest('Teste: Resumo do pedido');
    
    // Preparar checkout completo
    await navigateToBoxes();
    await addBoxToCart(TEST_BOXES.BASIC_BOX.name);
    await navigateToCart();
    await waitAndTap(element(by.id(TEST_IDS.CART.CHECKOUT_BUTTON)));
    await fillAddressForm(TEST_ADDRESSES.VALID_ADDRESS);
    await waitAndTap(element(by.text('Continuar para Pagamento')));
    await fillPaymentForm(TEST_CARDS.VALID_CARD);
    await waitAndTap(element(by.text('Revisar Pedido')));
    
    // Verificar resumo
    await expectVisible(TEST_IDS.CHECKOUT.SUMMARY_SECTION);
    await expect(element(by.text('Resumo do Pedido'))).toBeVisible();
    
    // Verificar itens
    await expect(element(by.text(TEST_BOXES.BASIC_BOX.name))).toBeVisible();
    
    // Verificar endereço
    await expect(element(by.text(TEST_ADDRESSES.VALID_ADDRESS.street))).toBeVisible();
    
    // Verificar pagamento (últimos 4 dígitos)
    await expect(element(by.text('•••• 1111'))).toBeVisible();
    
    logTest('Resumo do pedido funcionando');
  });

  it('deve finalizar compra com sucesso', async () => {
    logTest('Teste: Finalizar compra');
    
    // Preparar checkout completo
    await navigateToBoxes();
    await addBoxToCart(TEST_BOXES.BASIC_BOX.name);
    await navigateToCart();
    await waitAndTap(element(by.id(TEST_IDS.CART.CHECKOUT_BUTTON)));
    await fillAddressForm(TEST_ADDRESSES.VALID_ADDRESS);
    await waitAndTap(element(by.text('Continuar para Pagamento')));
    await fillPaymentForm(TEST_CARDS.VALID_CARD);
    await waitAndTap(element(by.text('Revisar Pedido')));
    
    // Finalizar pedido
    await waitAndTap(element(by.id(TEST_IDS.CHECKOUT.CONFIRM_BUTTON)));
    
    // Aguardar processamento
    await waitForElement(element(by.text('Processando pagamento...')), 5000);
    
    // Verificar sucesso
    await waitForElement(element(by.text(EXPECTED_TEXTS.CHECKOUT.success)), 10000);
    await expectVisible('order-success-animation');
    await expectVisible('order-number');
    
    // Verificar botões de ação
    await expectVisible('view-order-button');
    await expectVisible('continue-shopping-button');
    
    logTest('Compra finalizada com sucesso');
  });

  it('deve salvar endereço para próximas compras', async () => {
    logTest('Teste: Salvar endereço');
    
    // Primeira compra
    await navigateToBoxes();
    await addBoxToCart(TEST_BOXES.BASIC_BOX.name);
    await navigateToCart();
    await waitAndTap(element(by.id(TEST_IDS.CART.CHECKOUT_BUTTON)));
    
    // Preencher e marcar para salvar
    await fillAddressForm(TEST_ADDRESSES.VALID_ADDRESS);
    await waitAndTap(element(by.id('save-address-checkbox')));
    
    // Continuar até finalizar
    await waitAndTap(element(by.text('Continuar para Pagamento')));
    await fillPaymentForm(TEST_CARDS.VALID_CARD);
    await waitAndTap(element(by.text('Revisar Pedido')));
    await waitAndTap(element(by.id(TEST_IDS.CHECKOUT.CONFIRM_BUTTON)));
    await waitForElement(element(by.text(EXPECTED_TEXTS.CHECKOUT.success)), 10000);
    
    // Nova compra
    await waitAndTap(element(by.id('continue-shopping-button')));
    await addBoxToCart(TEST_BOXES.PREMIUM_BOX.name);
    await navigateToCart();
    await waitAndTap(element(by.id(TEST_IDS.CART.CHECKOUT_BUTTON)));
    
    // Verificar endereço salvo
    await expectVisible('saved-addresses-list');
    await expect(element(by.text(TEST_ADDRESSES.VALID_ADDRESS.street))).toBeVisible();
    
    logTest('Salvamento de endereço funcionando');
  });

  it('deve permitir adicionar mais itens durante checkout', async () => {
    logTest('Teste: Adicionar mais itens durante checkout');
    
    // Iniciar checkout
    await navigateToBoxes();
    await addBoxToCart(TEST_BOXES.BASIC_BOX.name);
    await navigateToCart();
    await waitAndTap(element(by.id(TEST_IDS.CART.CHECKOUT_BUTTON)));
    
    // Voltar para adicionar mais
    await waitAndTap(element(by.id('header-back-button')));
    await waitAndTap(element(by.text('Continuar Comprando')));
    
    // Adicionar outro item
    await addBoxToCart(TEST_BOXES.PREMIUM_BOX.name);
    
    // Voltar ao checkout
    await navigateToCart();
    
    // Verificar que ambos itens estão lá
    await expect(element(by.text(TEST_BOXES.BASIC_BOX.name))).toBeVisible();
    await expect(element(by.text(TEST_BOXES.PREMIUM_BOX.name))).toBeVisible();
    
    logTest('Adicionar itens durante checkout funcionando');
  });
});