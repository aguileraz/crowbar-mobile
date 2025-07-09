import { createNavigationContainerRef, NavigationContainerRefWithCurrent } from '@react-navigation/native';

/**
 * Serviço de navegação para permitir navegação fora de componentes React
 * Útil para navegação via notificações, deep links, etc.
 */

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Home: undefined;
  Shop: undefined;
  BoxDetails: { boxId: string };
  Cart: undefined;
  Checkout: undefined;
  OrderHistory: undefined;
  OrderDetails: { orderId: string };
  Profile: undefined;
  Favorites: undefined;
  Category: { categoryId: string; categoryName?: string };
  Search: { query?: string };
  Notifications: undefined;
  NotificationSettings: undefined;
  Reviews: { boxId?: string };
  Settings: undefined;
};

class NavigationService {
  private navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>;

  constructor() {
    this.navigationRef = createNavigationContainerRef<RootStackParamList>();
  }

  /**
   * Obter referência de navegação
   */
  getNavigationRef() {
    return this.navigationRef;
  }

  /**
   * Navegar para uma tela
   */
  navigate(name: keyof RootStackParamList, params?: any) {
    if (this.navigationRef.isReady()) {
      this.navigationRef.navigate(name as any, params);
    }
  }

  /**
   * Voltar para tela anterior
   */
  goBack() {
    if (this.navigationRef.isReady() && this.navigationRef.canGoBack()) {
      this.navigationRef.goBack();
    }
  }

  /**
   * Resetar navegação para uma tela específica
   */
  reset(routeName: keyof RootStackParamList, params?: any) {
    if (this.navigationRef.isReady()) {
      this.navigationRef.reset({
        index: 0,
        routes: [{ name: routeName as any, params }],
      });
    }
  }

  /**
   * Navegar baseado em dados de notificação
   */
  navigateFromNotification(data: any) {
    if (!data || !data.type) {
      this.navigate('Notifications');
      return;
    }

    switch (data.type) {
      case 'order_update':
      case 'order_status':
        if (data.orderId) {
          this.navigate('OrderDetails', { orderId: data.orderId });
        } else {
          this.navigate('OrderHistory');
        }
        break;

      case 'new_box':
      case 'box_restock':
        if (data.boxId) {
          this.navigate('BoxDetails', { boxId: data.boxId });
        } else {
          this.navigate('Shop');
        }
        break;

      case 'promotion':
      case 'discount':
        if (data.boxId) {
          this.navigate('BoxDetails', { boxId: data.boxId });
        } else if (data.categoryId) {
          this.navigate('Category', { 
            categoryId: data.categoryId,
            categoryName: data.categoryName 
          });
        } else {
          this.navigate('Shop');
        }
        break;

      case 'cart_reminder':
        this.navigate('Cart');
        break;

      case 'review_request':
        if (data.boxId) {
          this.navigate('Reviews', { boxId: data.boxId });
        }
        break;

      case 'system':
      case 'announcement':
      default:
        this.navigate('Notifications');
        break;
    }
  }

  /**
   * Verificar se está na tela especificada
   */
  isCurrentScreen(screenName: keyof RootStackParamList): boolean {
    if (!this.navigationRef.isReady()) return false;
    
    const currentRoute = this.navigationRef.getCurrentRoute();
    return currentRoute?.name === screenName;
  }

  /**
   * Obter nome da tela atual
   */
  getCurrentScreen(): string | undefined {
    if (!this.navigationRef.isReady()) return undefined;
    
    return this.navigationRef.getCurrentRoute()?.name;
  }

  /**
   * Navegar para deep link
   */
  handleDeepLink(url: string) {
    // Implementar lógica de deep linking
    // Exemplo: crowbar://box/123
    const match = url.match(/crowbar:\/\/(\w+)\/?(.*)/);
    
    if (!match) return;
    
    const [, screen, params] = match;
    
    switch (screen) {
      case 'box':
        if (params) {
          this.navigate('BoxDetails', { boxId: params });
        }
        break;
      case 'order':
        if (params) {
          this.navigate('OrderDetails', { orderId: params });
        }
        break;
      case 'category':
        if (params) {
          this.navigate('Category', { categoryId: params });
        }
        break;
      case 'cart':
        this.navigate('Cart');
        break;
      case 'profile':
        this.navigate('Profile');
        break;
      default:
        this.navigate('Home');
    }
  }
}

export const navigationService = new NavigationService();
export default navigationService;