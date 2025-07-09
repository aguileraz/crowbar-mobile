/**
 * Ações reutilizáveis para testes E2E do Crowbar Mobile
 * 
 * Centraliza ações comuns que são executadas em múltiplos testes
 * para evitar duplicação de código e facilitar manutenção.
 */

import { TEST_IDS, TEST_USERS, ACTION_TIMEOUTS } from './testData';

/**
 * Realiza login com usuário de teste
 */
export async function login(email = TEST_USERS.VALID_USER.email, password = TEST_USERS.VALID_USER.password) {
  logTest(`Realizando login com: ${email}`);
  
  // Aguardar tela de login
  await waitForScreen(TEST_IDS.AUTH.EMAIL_INPUT);
  
  // Preencher credenciais
  await waitAndType(element(by.id(TEST_IDS.AUTH.EMAIL_INPUT)), email);
  await waitAndType(element(by.id(TEST_IDS.AUTH.PASSWORD_INPUT)), password);
  
  // Realizar login
  await waitAndTap(element(by.id(TEST_IDS.AUTH.LOGIN_BUTTON)));
  
  // Aguardar navegação
  await sleep(ACTION_TIMEOUTS.NAVIGATION);
  
  // Verificar se login foi bem sucedido
  await waitForElement(element(by.id(TEST_IDS.NAV.HOME)));
  
  logTest('Login realizado com sucesso');
}

/**
 * Realiza logout do usuário atual
 */
export async function logout() {
  logTest('Realizando logout');
  
  // Navegar para perfil
  await navigateToProfile();
  
  // Realizar logout
  await scrollToElement(
    element(by.id('profile-scroll-view')),
    element(by.id(TEST_IDS.PROFILE.LOGOUT_BUTTON))
  );
  
  await waitAndTap(element(by.id(TEST_IDS.PROFILE.LOGOUT_BUTTON)));
  
  // Confirmar logout se necessário
  if (await element(by.text('Confirmar')).exists()) {
    await element(by.text('Confirmar')).tap();
  }
  
  // Aguardar retornar para tela de login
  await waitForScreen(TEST_IDS.AUTH.EMAIL_INPUT);
  
  logTest('Logout realizado com sucesso');
}

/**
 * Navega para a tela de caixas
 */
export async function navigateToBoxes() {
  logTest('Navegando para caixas');
  await waitAndTap(element(by.id(TEST_IDS.NAV.BOXES)));
  await waitForScreen(TEST_IDS.BOXES.LIST);
}

/**
 * Navega para o carrinho
 */
export async function navigateToCart() {
  logTest('Navegando para carrinho');
  await waitAndTap(element(by.id(TEST_IDS.NAV.CART)));
  await waitForScreen(TEST_IDS.CART.LIST);
}

/**
 * Navega para o perfil
 */
export async function navigateToProfile() {
  logTest('Navegando para perfil');
  await waitAndTap(element(by.id(TEST_IDS.NAV.PROFILE)));
  await waitForScreen(TEST_IDS.PROFILE.AVATAR);
}

/**
 * Adiciona uma caixa ao carrinho
 */
export async function addBoxToCart(boxName) {
  logTest(`Adicionando caixa ao carrinho: ${boxName}`);
  
  // Procurar e tocar na caixa
  await waitAndTap(element(by.text(boxName)).atIndex(0));
  
  // Aguardar tela de detalhes
  await waitForScreen(TEST_IDS.BOX_DETAILS.IMAGE);
  
  // Adicionar ao carrinho
  await waitAndTap(element(by.id(TEST_IDS.BOX_DETAILS.ADD_TO_CART)));
  
  // Aguardar confirmação
  await waitForElement(element(by.text('Adicionado ao carrinho')));
  
  logTest('Caixa adicionada ao carrinho');
}

/**
 * Remove item do carrinho
 */
export async function removeFromCart(itemIndex = 0) {
  logTest(`Removendo item ${itemIndex} do carrinho`);
  
  const removeButton = element(by.id(TEST_IDS.CART.REMOVE)).atIndex(itemIndex);
  await waitAndTap(removeButton);
  
  // Confirmar remoção se necessário
  if (await element(by.text('Confirmar')).exists()) {
    await element(by.text('Confirmar')).tap();
  }
  
  await sleep(ACTION_TIMEOUTS.ANIMATION);
  
  logTest('Item removido do carrinho');
}

/**
 * Limpa todo o carrinho
 */
export async function clearCart() {
  logTest('Limpando carrinho');
  
  await navigateToCart();
  
  // Verificar se carrinho está vazio
  if (await element(by.id(TEST_IDS.CART.EMPTY_MESSAGE)).exists()) {
    logTest('Carrinho já está vazio');
    return;
  }
  
  // Remover todos os itens
  while (!(await element(by.id(TEST_IDS.CART.EMPTY_MESSAGE)).exists())) {
    await removeFromCart(0);
  }
  
  logTest('Carrinho limpo');
}

/**
 * Preenche formulário de endereço
 */
export async function fillAddressForm(address) {
  logTest('Preenchendo formulário de endereço');
  
  // CEP
  await waitAndType(element(by.id(TEST_IDS.CHECKOUT.CEP_INPUT)), address.cep);
  await sleep(ACTION_TIMEOUTS.API_CALL); // Aguardar busca de CEP
  
  // Número
  await waitAndType(element(by.id(TEST_IDS.CHECKOUT.NUMBER_INPUT)), address.number);
  
  // Complemento (se existir)
  if (address.complement) {
    await waitAndType(element(by.id('checkout-complement-input')), address.complement);
  }
  
  logTest('Endereço preenchido');
}

/**
 * Preenche formulário de pagamento
 */
export async function fillPaymentForm(card) {
  logTest('Preenchendo formulário de pagamento');
  
  // Número do cartão
  await waitAndType(element(by.id(TEST_IDS.CHECKOUT.CARD_NUMBER_INPUT)), card.number);
  
  // Nome no cartão
  await waitAndType(element(by.id(TEST_IDS.CHECKOUT.CARD_NAME_INPUT)), card.name);
  
  // Validade
  await waitAndType(element(by.id(TEST_IDS.CHECKOUT.CARD_EXPIRY_INPUT)), card.expiry);
  
  // CVV
  await waitAndType(element(by.id(TEST_IDS.CHECKOUT.CARD_CVV_INPUT)), card.cvv);
  
  logTest('Pagamento preenchido');
}

/**
 * Realiza busca de caixas
 */
export async function searchBoxes(searchTerm) {
  logTest(`Buscando por: ${searchTerm}`);
  
  await waitAndType(element(by.id(TEST_IDS.BOXES.SEARCH_INPUT)), searchTerm);
  await sleep(ACTION_TIMEOUTS.API_CALL);
  
  logTest('Busca realizada');
}

/**
 * Aplica filtro de categoria
 */
export async function filterByCategory(category) {
  logTest(`Filtrando por categoria: ${category}`);
  
  // Abrir filtros
  await waitAndTap(element(by.id(TEST_IDS.BOXES.FILTER_BUTTON)));
  
  // Selecionar categoria
  await waitAndTap(element(by.text(category)));
  
  // Aplicar filtro
  await waitAndTap(element(by.text('Aplicar')));
  
  await sleep(ACTION_TIMEOUTS.API_CALL);
  
  logTest('Filtro aplicado');
}

/**
 * Ordena caixas por critério
 */
export async function sortBoxes(criteria) {
  logTest(`Ordenando por: ${criteria}`);
  
  // Abrir opções de ordenação
  await waitAndTap(element(by.id(TEST_IDS.BOXES.SORT_BUTTON)));
  
  // Selecionar critério
  await waitAndTap(element(by.text(criteria)));
  
  await sleep(ACTION_TIMEOUTS.API_CALL);
  
  logTest('Ordenação aplicada');
}

/**
 * Abre uma caixa mistério
 */
export async function openMysteryBox() {
  logTest('Abrindo caixa mistério');
  
  // Aguardar animação carregar
  await waitForScreen(TEST_IDS.BOX_OPENING.CONTAINER);
  await sleep(ACTION_TIMEOUTS.ANIMATION);
  
  // Tocar para abrir
  await waitAndTap(element(by.id(TEST_IDS.BOX_OPENING.OPEN_BUTTON)));
  
  // Aguardar animação de abertura
  await sleep(ACTION_TIMEOUTS.BOX_OPENING);
  
  // Aguardar resultado
  await waitForElement(element(by.id(TEST_IDS.BOX_OPENING.RESULT_CONTAINER)));
  
  logTest('Caixa aberta com sucesso');
}

/**
 * Adiciona item aos favoritos
 */
export async function addToFavorites() {
  logTest('Adicionando aos favoritos');
  
  await waitAndTap(element(by.id(TEST_IDS.BOX_DETAILS.FAVORITE)));
  await waitForElement(element(by.text('Adicionado aos favoritos')));
  
  logTest('Adicionado aos favoritos');
}

/**
 * Remove item dos favoritos
 */
export async function removeFromFavorites() {
  logTest('Removendo dos favoritos');
  
  await waitAndTap(element(by.id(TEST_IDS.BOX_DETAILS.FAVORITE)));
  await waitForElement(element(by.text('Removido dos favoritos')));
  
  logTest('Removido dos favoritos');
}

/**
 * Verifica se está logado, se não, realiza login
 */
export async function ensureLoggedIn() {
  logTest('Verificando se está logado');
  
  // Verificar se está na tela inicial
  if (await element(by.id(TEST_IDS.NAV.HOME)).exists()) {
    logTest('Já está logado');
    return;
  }
  
  // Se não está logado, fazer login
  await login();
}

/**
 * Aguarda e fecha modal/toast se aparecer
 */
export async function dismissModalIfExists() {
  if (await element(by.id(TEST_IDS.COMMON.MODAL)).exists()) {
    logTest('Fechando modal');
    await waitAndTap(element(by.id(TEST_IDS.COMMON.MODAL_CLOSE)));
    await sleep(ACTION_TIMEOUTS.ANIMATION);
  }
}

/**
 * Verifica se elemento contém texto esperado
 */
export async function expectText(elementId, expectedText) {
  await expect(element(by.id(elementId))).toHaveText(expectedText);
}

/**
 * Verifica se elemento está visível
 */
export async function expectVisible(elementId) {
  await expect(element(by.id(elementId))).toBeVisible();
}

/**
 * Verifica se elemento não está visível
 */
export async function expectNotVisible(elementId) {
  await expect(element(by.id(elementId))).toBeNotVisible();
}

/**
 * Realiza swipe para atualizar (pull to refresh)
 */
export async function pullToRefresh(scrollViewId) {
  logTest('Realizando pull to refresh');
  
  await element(by.id(scrollViewId)).swipe('down', 'fast', 0.8);
  await sleep(ACTION_TIMEOUTS.API_CALL);
  
  logTest('Pull to refresh concluído');
}