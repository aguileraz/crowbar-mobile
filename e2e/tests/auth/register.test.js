/**
 * Testes E2E para fluxo de registro
 * 
 * Testa todos os cenários relacionados ao registro de novos usuários
 * incluindo validações e casos de erro.
 */

import { TEST_USERS, TEST_IDS, EXPECTED_TEXTS } from '../../helpers/testData';
import { expectVisible, expectText } from '../../helpers/actions';

describe('Register Flow', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true });
    
    // Navegar para tela de registro
    await waitForScreen(TEST_IDS.AUTH.EMAIL_INPUT);
    await waitAndTap(element(by.id(TEST_IDS.AUTH.CREATE_ACCOUNT)));
    await waitForScreen(TEST_IDS.AUTH.NAME_INPUT);
  });

  afterEach(async () => {
    await device.terminateApp();
  });

  it('deve criar nova conta com sucesso', async () => {
    logTest('Teste: Criar nova conta');
    
    // Gerar dados únicos para novo usuário
    const uniqueEmail = `teste.${Date.now()}@crowbar.com`;
    const cpf = generateValidCPF();
    
    // Preencher formulário
    await waitAndType(element(by.id(TEST_IDS.AUTH.NAME_INPUT)), TEST_USERS.NEW_USER.name);
    await waitAndType(element(by.id(TEST_IDS.AUTH.EMAIL_INPUT)), uniqueEmail);
    await waitAndType(element(by.id(TEST_IDS.AUTH.CPF_INPUT)), cpf);
    await waitAndType(element(by.id(TEST_IDS.AUTH.PASSWORD_INPUT)), TEST_USERS.NEW_USER.password);
    
    // Aceitar termos
    await waitAndTap(element(by.id('auth-terms-checkbox')));
    
    // Criar conta
    await waitAndTap(element(by.id(TEST_IDS.AUTH.REGISTER_BUTTON)));
    
    // Verificar mensagem de sucesso
    await waitForElement(element(by.text(EXPECTED_TEXTS.REGISTER.success)));
    
    // Verificar que foi redirecionado para home
    await waitForScreen(TEST_IDS.NAV.HOME, 5000);
    
    logTest('Conta criada com sucesso');
  });

  it('deve validar campos obrigatórios', async () => {
    logTest('Teste: Validação de campos obrigatórios no registro');
    
    // Tentar registrar sem preencher campos
    await waitAndTap(element(by.id(TEST_IDS.AUTH.REGISTER_BUTTON)));
    
    // Verificar mensagens de validação
    await waitForElement(element(by.text('Nome é obrigatório')));
    await waitForElement(element(by.text('E-mail é obrigatório')));
    await waitForElement(element(by.text('CPF é obrigatório')));
    await waitForElement(element(by.text('Senha é obrigatória')));
    
    logTest('Validações de campos obrigatórios funcionando');
  });

  it('deve validar formato de email', async () => {
    logTest('Teste: Validação de formato de email no registro');
    
    // Preencher com email inválido
    await waitAndType(element(by.id(TEST_IDS.AUTH.EMAIL_INPUT)), 'emailinvalido');
    await waitAndTap(element(by.id(TEST_IDS.AUTH.REGISTER_BUTTON)));
    
    // Verificar mensagem de validação
    await waitForElement(element(by.text('E-mail inválido')));
    
    logTest('Validação de formato de email funcionando');
  });

  it('deve validar CPF', async () => {
    logTest('Teste: Validação de CPF');
    
    // Tentar com CPF inválido
    await waitAndType(element(by.id(TEST_IDS.AUTH.CPF_INPUT)), '00000000000');
    await waitAndTap(element(by.id(TEST_IDS.AUTH.REGISTER_BUTTON)));
    
    // Verificar mensagem de validação
    await waitForElement(element(by.text('CPF inválido')));
    
    // Tentar com CPF com formato incorreto
    await element(by.id(TEST_IDS.AUTH.CPF_INPUT)).clearText();
    await waitAndType(element(by.id(TEST_IDS.AUTH.CPF_INPUT)), '123');
    await waitAndTap(element(by.id(TEST_IDS.AUTH.REGISTER_BUTTON)));
    
    // Verificar mensagem de validação
    await waitForElement(element(by.text('CPF deve ter 11 dígitos')));
    
    logTest('Validação de CPF funcionando');
  });

  it('deve validar força da senha', async () => {
    logTest('Teste: Validação de força da senha');
    
    // Preencher outros campos
    await waitAndType(element(by.id(TEST_IDS.AUTH.NAME_INPUT)), TEST_USERS.NEW_USER.name);
    await waitAndType(element(by.id(TEST_IDS.AUTH.EMAIL_INPUT)), `teste.${Date.now()}@crowbar.com`);
    await waitAndType(element(by.id(TEST_IDS.AUTH.CPF_INPUT)), generateValidCPF());
    
    // Tentar senha fraca
    await waitAndType(element(by.id(TEST_IDS.AUTH.PASSWORD_INPUT)), '123');
    await waitAndTap(element(by.id(TEST_IDS.AUTH.REGISTER_BUTTON)));
    
    // Verificar mensagem de validação
    await waitForElement(element(by.text('Senha deve ter no mínimo 8 caracteres')));
    
    // Tentar senha sem caracteres especiais
    await element(by.id(TEST_IDS.AUTH.PASSWORD_INPUT)).clearText();
    await waitAndType(element(by.id(TEST_IDS.AUTH.PASSWORD_INPUT)), 'Senha123');
    
    // Verificar indicador de força
    await waitForElement(element(by.text('Senha média')));
    
    // Tentar senha forte
    await element(by.id(TEST_IDS.AUTH.PASSWORD_INPUT)).clearText();
    await waitAndType(element(by.id(TEST_IDS.AUTH.PASSWORD_INPUT)), 'Senha123!@#');
    
    // Verificar indicador de força
    await waitForElement(element(by.text('Senha forte')));
    
    logTest('Validação de força da senha funcionando');
  });

  it('deve mostrar erro para email já cadastrado', async () => {
    logTest('Teste: Email já cadastrado');
    
    // Preencher com email existente
    await waitAndType(element(by.id(TEST_IDS.AUTH.NAME_INPUT)), TEST_USERS.NEW_USER.name);
    await waitAndType(element(by.id(TEST_IDS.AUTH.EMAIL_INPUT)), TEST_USERS.VALID_USER.email);
    await waitAndType(element(by.id(TEST_IDS.AUTH.CPF_INPUT)), generateValidCPF());
    await waitAndType(element(by.id(TEST_IDS.AUTH.PASSWORD_INPUT)), TEST_USERS.NEW_USER.password);
    
    // Aceitar termos
    await waitAndTap(element(by.id('auth-terms-checkbox')));
    
    // Tentar criar conta
    await waitAndTap(element(by.id(TEST_IDS.AUTH.REGISTER_BUTTON)));
    
    // Verificar mensagem de erro
    await waitForElement(element(by.text(EXPECTED_TEXTS.REGISTER.errorEmail)));
    
    logTest('Erro de email já cadastrado exibido corretamente');
  });

  it('deve validar aceitação dos termos', async () => {
    logTest('Teste: Validação de aceitação dos termos');
    
    // Preencher formulário completo
    await waitAndType(element(by.id(TEST_IDS.AUTH.NAME_INPUT)), TEST_USERS.NEW_USER.name);
    await waitAndType(element(by.id(TEST_IDS.AUTH.EMAIL_INPUT)), `teste.${Date.now()}@crowbar.com`);
    await waitAndType(element(by.id(TEST_IDS.AUTH.CPF_INPUT)), generateValidCPF());
    await waitAndType(element(by.id(TEST_IDS.AUTH.PASSWORD_INPUT)), TEST_USERS.NEW_USER.password);
    
    // Tentar criar conta sem aceitar termos
    await waitAndTap(element(by.id(TEST_IDS.AUTH.REGISTER_BUTTON)));
    
    // Verificar mensagem de validação
    await waitForElement(element(by.text('Você deve aceitar os termos de uso')));
    
    logTest('Validação de termos funcionando');
  });

  it('deve abrir termos de uso', async () => {
    logTest('Teste: Abrir termos de uso');
    
    // Tocar no link dos termos
    await waitAndTap(element(by.text('termos de uso')));
    
    // Verificar que modal foi aberto
    await waitForElement(element(by.text('Termos de Uso')));
    await expectVisible('terms-modal-content');
    
    // Fechar modal
    await waitAndTap(element(by.id('terms-modal-close')));
    
    logTest('Visualização de termos funcionando');
  });

  it('deve abrir política de privacidade', async () => {
    logTest('Teste: Abrir política de privacidade');
    
    // Tocar no link da política
    await waitAndTap(element(by.text('política de privacidade')));
    
    // Verificar que modal foi aberto
    await waitForElement(element(by.text('Política de Privacidade')));
    await expectVisible('privacy-modal-content');
    
    // Fechar modal
    await waitAndTap(element(by.id('privacy-modal-close')));
    
    logTest('Visualização de política funcionando');
  });

  it('deve formatar CPF automaticamente', async () => {
    logTest('Teste: Formatação automática de CPF');
    
    // Digitar CPF sem formatação
    await waitAndType(element(by.id(TEST_IDS.AUTH.CPF_INPUT)), '12345678901');
    
    // Verificar que foi formatado
    const cpfField = element(by.id(TEST_IDS.AUTH.CPF_INPUT));
    await expect(cpfField).toHaveText('123.456.789-01');
    
    logTest('Formatação de CPF funcionando');
  });

  it('deve navegar de volta para login', async () => {
    logTest('Teste: Navegação de volta para login');
    
    // Tocar no botão voltar ou link "Já tem conta?"
    await waitAndTap(element(by.text('Já tem uma conta? Entrar')));
    
    // Verificar que voltou para login
    await waitForScreen(TEST_IDS.AUTH.LOGIN_BUTTON);
    await expectVisible(TEST_IDS.AUTH.FORGOT_PASSWORD);
    
    logTest('Navegação de volta funcionando');
  });
});

/**
 * Gera um CPF válido para testes
 */
function generateValidCPF() {
  const randomDigits = () => Math.floor(Math.random() * 9);
  const cpfArray = Array.from({ length: 9 }, randomDigits);
  
  // Calcular primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += cpfArray[i] * (10 - i);
  }
  const firstVerifier = 11 - (sum % 11);
  cpfArray.push(firstVerifier >= 10 ? 0 : firstVerifier);
  
  // Calcular segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += cpfArray[i] * (11 - i);
  }
  const secondVerifier = 11 - (sum % 11);
  cpfArray.push(secondVerifier >= 10 ? 0 : secondVerifier);
  
  return cpfArray.join('');
}