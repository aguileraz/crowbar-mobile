 
/**
 * Dados de teste para os testes E2E do Crowbar Mobile
 * 
 * Centraliza todos os dados de teste utilizados nos diferentes cenários
 * para facilitar manutenção e reutilização.
 */

// Dados de usuário para testes
export const TEST_USERS = {
  // Usuário válido para login
  VALID_USER: {
    email: 'teste.e2e@crowbar.com',
    password: 'Teste123!@#',
    name: 'Usuário Teste E2E'
  },
  
  // Novo usuário para registro
  NEW_USER: {
    email: `teste.${Date.now()}@crowbar.com`,
    password: 'NovoUser123!',
    name: 'Novo Usuário E2E',
    cpf: '12345678901'
  },
  
  // Usuário para testes de erro
  INVALID_USER: {
    email: 'invalido@crowbar.com',
    password: 'senhaerrada'
  }
};

// Dados de endereço para testes
export const TEST_ADDRESSES = {
  VALID_ADDRESS: {
    cep: '01310-100',
    street: 'Avenida Paulista',
    number: '1000',
    complement: 'Apto 101',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP'
  },
  
  DELIVERY_ADDRESS: {
    cep: '22250-040',
    street: 'Rua Visconde de Pirajá',
    number: '500',
    complement: '',
    neighborhood: 'Ipanema',
    city: 'Rio de Janeiro',
    state: 'RJ'
  }
};

// Dados de cartão para testes
export const TEST_CARDS = {
  VALID_CARD: {
    number: '4111111111111111',
    name: 'TESTE E2E CROWBAR',
    expiry: '12/30',
    cvv: '123'
  },
  
  INVALID_CARD: {
    number: '4111111111111112',
    name: 'CARTAO INVALIDO',
    expiry: '01/20',
    cvv: '999'
  }
};

// Dados de caixas para testes
export const TEST_BOXES = {
  // Caixa básica sempre disponível
  BASIC_BOX: {
    id: 'basic-box-001',
    name: 'Caixa Mistério Básica',
    price: 49.90,
    category: 'Eletrônicos'
  },
  
  // Caixa premium
  PREMIUM_BOX: {
    id: 'premium-box-001',
    name: 'Caixa Premium Gaming',
    price: 299.90,
    category: 'Gaming'
  },
  
  // Caixa em promoção
  PROMO_BOX: {
    id: 'promo-box-001',
    name: 'Caixa Promoção Especial',
    originalPrice: 99.90,
    price: 59.90,
    category: 'Diversos'
  }
};

// Textos esperados na aplicação
export const EXPECTED_TEXTS = {
  // Tela de login
  LOGIN: {
    title: 'Entrar',
    forgotPassword: 'Esqueci minha senha',
    register: 'Criar conta',
    errorInvalid: 'E-mail ou senha inválidos'
  },
  
  // Tela de registro
  REGISTER: {
    title: 'Criar Conta',
    success: 'Conta criada com sucesso!',
    errorEmail: 'E-mail já cadastrado'
  },
  
  // Tela de caixas
  BOXES: {
    title: 'Caixas Mistério',
    filter: 'Filtrar',
    sort: 'Ordenar',
    addToCart: 'Adicionar ao Carrinho'
  },
  
  // Carrinho
  CART: {
    title: 'Carrinho',
    empty: 'Seu carrinho está vazio',
    checkout: 'Finalizar Compra',
    remove: 'Remover'
  },
  
  // Checkout
  CHECKOUT: {
    title: 'Finalizar Compra',
    payment: 'Pagamento',
    delivery: 'Entrega',
    confirm: 'Confirmar Pedido',
    success: 'Pedido realizado com sucesso!'
  },
  
  // Abertura de caixa
  BOX_OPENING: {
    title: 'Abrir Caixa',
    open: 'Abrir Agora',
    reveal: 'Revelar Item',
    congrats: 'Parabéns!'
  }
};

// IDs de teste para elementos
export const TEST_IDS = {
  // Navegação
  NAV: {
    HOME: 'nav-home',
    BOXES: 'nav-boxes',
    CART: 'nav-cart',
    PROFILE: 'nav-profile'
  },
  
  // Login/Registro
  AUTH: {
    EMAIL_INPUT: 'auth-email-input',
    PASSWORD_INPUT: 'auth-password-input',
    NAME_INPUT: 'auth-name-input',
    CPF_INPUT: 'auth-cpf-input',
    LOGIN_BUTTON: 'auth-login-button',
    REGISTER_BUTTON: 'auth-register-button',
    FORGOT_PASSWORD: 'auth-forgot-password',
    CREATE_ACCOUNT: 'auth-create-account'
  },
  
  // Caixas
  BOXES: {
    LIST: 'boxes-list',
    ITEM: 'box-item',
    FILTER_BUTTON: 'boxes-filter-button',
    SORT_BUTTON: 'boxes-sort-button',
    SEARCH_INPUT: 'boxes-search-input',
    CATEGORY_FILTER: 'boxes-category-filter',
    PRICE_FILTER: 'boxes-price-filter'
  },
  
  // Detalhes da caixa
  BOX_DETAILS: {
    IMAGE: 'box-details-image',
    TITLE: 'box-details-title',
    PRICE: 'box-details-price',
    DESCRIPTION: 'box-details-description',
    ADD_TO_CART: 'box-details-add-to-cart',
    FAVORITE: 'box-details-favorite',
    QUANTITY: 'box-details-quantity'
  },
  
  // Carrinho
  CART: {
    LIST: 'cart-list',
    ITEM: 'cart-item',
    QUANTITY: 'cart-item-quantity',
    REMOVE: 'cart-item-remove',
    TOTAL: 'cart-total',
    CHECKOUT_BUTTON: 'cart-checkout-button',
    EMPTY_MESSAGE: 'cart-empty-message'
  },
  
  // Checkout
  CHECKOUT: {
    ADDRESS_SECTION: 'checkout-address',
    PAYMENT_SECTION: 'checkout-payment',
    SUMMARY_SECTION: 'checkout-summary',
    CEP_INPUT: 'checkout-cep-input',
    ADDRESS_INPUT: 'checkout-address-input',
    NUMBER_INPUT: 'checkout-number-input',
    CARD_NUMBER_INPUT: 'checkout-card-number',
    CARD_NAME_INPUT: 'checkout-card-name',
    CARD_EXPIRY_INPUT: 'checkout-card-expiry',
    CARD_CVV_INPUT: 'checkout-card-cvv',
    CONFIRM_BUTTON: 'checkout-confirm-button'
  },
  
  // Abertura de caixa
  BOX_OPENING: {
    CONTAINER: 'box-opening-container',
    BOX_3D: 'box-opening-3d',
    OPEN_BUTTON: 'box-opening-open-button',
    SKIP_BUTTON: 'box-opening-skip-button',
    RESULT_CONTAINER: 'box-opening-result',
    ITEM_IMAGE: 'box-opening-item-image',
    ITEM_NAME: 'box-opening-item-name',
    ITEM_VALUE: 'box-opening-item-value',
    SHARE_BUTTON: 'box-opening-share',
    CONTINUE_BUTTON: 'box-opening-continue'
  },
  
  // Perfil
  PROFILE: {
    AVATAR: 'profile-avatar',
    NAME: 'profile-name',
    EMAIL: 'profile-email',
    ORDERS_BUTTON: 'profile-orders',
    FAVORITES_BUTTON: 'profile-favorites',
    SETTINGS_BUTTON: 'profile-settings',
    LOGOUT_BUTTON: 'profile-logout'
  },
  
  // Componentes comuns
  COMMON: {
    LOADING: 'common-loading',
    ERROR: 'common-error',
    SUCCESS: 'common-success',
    MODAL: 'common-modal',
    MODAL_CLOSE: 'common-modal-close',
    TOAST: 'common-toast'
  }
};

// Timeouts específicos para ações
export const ACTION_TIMEOUTS = {
  TAP: 500,
  TYPE: 1000,
  NAVIGATION: 3000,
  API_CALL: 5000,
  ANIMATION: 2000,
  BOX_OPENING: 10000
};

// Configurações de ambiente para testes
export const TEST_ENV = {
  BASE_URL: 'https://api-staging.crowbar.com.br',
  MOCK_PAYMENTS: true,
  SKIP_ANIMATIONS: true,
  LOG_LEVEL: 'debug'
};