#!/usr/bin/env node

/**
 * Crowbar Mobile - Store Assets Generator
 * Generates icons, screenshots, and other assets for app stores
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  sourceIcon: './assets/icon.png',
  sourceScreenshots: './assets/screenshots',
  outputDir: './store-assets',
  
  // Icon sizes for different platforms
  iconSizes: {
    ios: [
      { size: 20, name: 'Icon-20.png', scale: [1, 2, 3] },
      { size: 29, name: 'Icon-29.png', scale: [1, 2, 3] },
      { size: 40, name: 'Icon-40.png', scale: [1, 2, 3] },
      { size: 58, name: 'Icon-58.png', scale: [1] },
      { size: 60, name: 'Icon-60.png', scale: [2, 3] },
      { size: 76, name: 'Icon-76.png', scale: [1, 2] },
      { size: 83.5, name: 'Icon-83.5@2x.png', scale: [2] },
      { size: 120, name: 'Icon-120.png', scale: [1] },
      { size: 152, name: 'Icon-152.png', scale: [1] },
      { size: 167, name: 'Icon-167.png', scale: [1] },
      { size: 180, name: 'Icon-180.png', scale: [1] },
      { size: 1024, name: 'Icon-1024.png', scale: [1] },
    ],
    android: [
      { size: 36, density: 'ldpi', name: 'ic_launcher.png' },
      { size: 48, density: 'mdpi', name: 'ic_launcher.png' },
      { size: 72, density: 'hdpi', name: 'ic_launcher.png' },
      { size: 96, density: 'xhdpi', name: 'ic_launcher.png' },
      { size: 144, density: 'xxhdpi', name: 'ic_launcher.png' },
      { size: 192, density: 'xxxhdpi', name: 'ic_launcher.png' },
      { size: 512, density: 'store', name: 'ic_launcher.png' },
    ],
  },
  
  // Screenshot sizes
  screenshotSizes: {
    ios: {
      'iPhone 6.5"': { width: 1284, height: 2778 },
      'iPhone 5.5"': { width: 1242, height: 2208 },
      'iPad Pro 12.9"': { width: 2048, height: 2732 },
      'iPad Pro 11"': { width: 1668, height: 2388 },
    },
    android: {
      'Phone': { width: 1080, height: 1920 },
      'Tablet 7"': { width: 1200, height: 1920 },
      'Tablet 10"': { width: 1600, height: 2560 },
    },
  },
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Logging functions
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  title: (msg) => console.log(`${colors.cyan}${colors.bold}🎨 ${msg}${colors.reset}\n`),
};

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Check if ImageMagick is available
 */
function checkImageMagick() {
  try {
    execSync('magick -version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    try {
      execSync('convert -version', { stdio: 'pipe' });
      return true;
    } catch (error2) {
      return false;
    }
  }
}

/**
 * Get ImageMagick command
 */
function getImageMagickCommand() {
  try {
    execSync('magick -version', { stdio: 'pipe' });
    return 'magick';
  } catch (error) {
    return 'convert';
  }
}

/**
 * Generate app icons
 */
function generateAppIcons() {
  log.info('Generating app icons...');
  
  if (!fs.existsSync(CONFIG.sourceIcon)) {
    log.error(`Source icon not found: ${CONFIG.sourceIcon}`);
    return false;
  }

  if (!checkImageMagick()) {
    log.error('ImageMagick not found. Please install ImageMagick to generate icons.');
    log.info('Download from: https://imagemagick.org/script/download.php');
    return false;
  }

  const magickCmd = getImageMagickCommand();
  let generatedCount = 0;

  // Generate iOS icons
  log.info('Generating iOS icons...');
  const iosIconDir = path.join(CONFIG.outputDir, 'ios', 'icons');
  ensureDir(iosIconDir);

  CONFIG.iconSizes.ios.forEach(iconConfig => {
    iconConfig.scale.forEach(scale => {
      const size = Math.round(iconConfig.size * scale);
      const filename = scale === 1 ? iconConfig.name : iconConfig.name.replace('.png', `@${scale}x.png`);
      const outputPath = path.join(iosIconDir, filename);

      try {
        execSync(`${magickCmd} "${CONFIG.sourceIcon}" -resize ${size}x${size} "${outputPath}"`, { stdio: 'pipe' });
        generatedCount++;
      } catch (error) {
        log.error(`Failed to generate ${filename}: ${error.message}`);
      }
    });
  });

  // Generate Android icons
  log.info('Generating Android icons...');
  CONFIG.iconSizes.android.forEach(iconConfig => {
    const androidIconDir = path.join(CONFIG.outputDir, 'android', `mipmap-${iconConfig.density}`);
    ensureDir(androidIconDir);
    
    const outputPath = path.join(androidIconDir, iconConfig.name);

    try {
      execSync(`${magickCmd} "${CONFIG.sourceIcon}" -resize ${iconConfig.size}x${iconConfig.size} "${outputPath}"`, { stdio: 'pipe' });
      generatedCount++;
    } catch (error) {
      log.error(`Failed to generate ${iconConfig.name} for ${iconConfig.density}: ${error.message}`);
    }
  });

  log.success(`Generated ${generatedCount} app icons`);
  return true;
}

/**
 * Generate feature graphics
 */
function generateFeatureGraphics() {
  log.info('Generating feature graphics...');
  
  const featureGraphicDir = path.join(CONFIG.outputDir, 'feature-graphics');
  ensureDir(featureGraphicDir);

  // This would typically use a design template
  // For now, we'll create placeholder graphics
  const graphics = [
    { name: 'google-play-feature.png', width: 1024, height: 500 },
    { name: 'app-store-preview.png', width: 1200, height: 630 },
  ];

  if (!checkImageMagick()) {
    log.warning('ImageMagick not available. Skipping feature graphics generation.');
    return false;
  }

  const magickCmd = getImageMagickCommand();
  let generatedCount = 0;

  graphics.forEach(graphic => {
    const outputPath = path.join(featureGraphicDir, graphic.name);
    
    try {
      // Create a placeholder graphic with gradient background
      const cmd = `${magickCmd} -size ${graphic.width}x${graphic.height} ` +
                  `gradient:#667eea-#764ba2 ` +
                  `-gravity center -pointsize 48 -fill white ` +
                  `-annotate +0+0 "Crowbar Mobile" "${outputPath}"`;
      
      execSync(cmd, { stdio: 'pipe' });
      generatedCount++;
    } catch (error) {
      log.error(`Failed to generate ${graphic.name}: ${error.message}`);
    }
  });

  log.success(`Generated ${generatedCount} feature graphics`);
  return true;
}

/**
 * Process screenshots
 */
function processScreenshots() {
  log.info('Processing screenshots...');
  
  if (!fs.existsSync(CONFIG.sourceScreenshots)) {
    log.warning(`Screenshots directory not found: ${CONFIG.sourceScreenshots}`);
    log.info('Please add screenshots to the assets/screenshots directory');
    return false;
  }

  const screenshotOutputDir = path.join(CONFIG.outputDir, 'screenshots');
  ensureDir(screenshotOutputDir);

  // Copy and organize screenshots
  const platforms = ['ios', 'android'];
  let processedCount = 0;

  platforms.forEach(platform => {
    const platformDir = path.join(CONFIG.sourceScreenshots, platform);
    if (fs.existsSync(platformDir)) {
      const outputPlatformDir = path.join(screenshotOutputDir, platform);
      ensureDir(outputPlatformDir);

      const files = fs.readdirSync(platformDir);
      files.forEach(file => {
        if (file.match(/\.(png|jpg|jpeg)$/i)) {
          const sourcePath = path.join(platformDir, file);
          const outputPath = path.join(outputPlatformDir, file);
          
          try {
            fs.copyFileSync(sourcePath, outputPath);
            processedCount++;
          } catch (error) {
            log.error(`Failed to copy ${file}: ${error.message}`);
          }
        }
      });
    }
  });

  log.success(`Processed ${processedCount} screenshots`);
  return true;
}

/**
 * Generate store listing files
 */
function generateStoreListings() {
  log.info('Generating store listing files...');
  
  const metadataPath = path.join(CONFIG.outputDir, 'app-store-metadata.json');
  if (!fs.existsSync(metadataPath)) {
    log.error('Metadata file not found. Please create store-assets/app-store-metadata.json');
    return false;
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  
  // Generate App Store listing
  const appStoreDir = path.join(CONFIG.outputDir, 'app-store');
  ensureDir(appStoreDir);
  
  const appStoreListing = {
    name: metadata.appStore.appName,
    subtitle: metadata.appStore.subtitle,
    description: metadata.appStore.description.full,
    keywords: metadata.appStore.keywords.join(', '),
    supportURL: metadata.appStore.supportURL,
    marketingURL: metadata.appStore.marketingURL,
    privacyURL: metadata.appStore.privacyPolicyURL,
    category: metadata.appStore.category,
    releaseNotes: metadata.appStore.releaseNotes.notes,
  };
  
  fs.writeFileSync(
    path.join(appStoreDir, 'listing.json'),
    JSON.stringify(appStoreListing, null, 2)
  );

  // Generate Google Play listing
  const googlePlayDir = path.join(CONFIG.outputDir, 'google-play');
  ensureDir(googlePlayDir);
  
  const googlePlayListing = {
    title: metadata.googlePlay.appName,
    shortDescription: metadata.googlePlay.shortDescription,
    fullDescription: metadata.googlePlay.fullDescription,
    category: metadata.googlePlay.category,
    tags: metadata.googlePlay.tags,
    contentRating: metadata.googlePlay.contentRating,
    contactEmail: metadata.common.supportEmail,
    website: metadata.common.websiteURL,
  };
  
  fs.writeFileSync(
    path.join(googlePlayDir, 'listing.json'),
    JSON.stringify(googlePlayListing, null, 2)
  );

  log.success('Generated store listing files');
  return true;
}

/**
 * Generate privacy policy
 */
function generatePrivacyPolicy() {
  log.info('Generating privacy policy...');
  
  const privacyPolicy = `# Política de Privacidade - Crowbar Mobile

**Última atualização:** ${new Date().toLocaleDateString('pt-BR')}

## 1. Informações que Coletamos

### 1.1 Informações Pessoais
- Nome e endereço de e-mail
- Informações de perfil
- Histórico de compras
- Preferências de usuário

### 1.2 Informações Técnicas
- Dados de uso do aplicativo
- Informações do dispositivo
- Logs de erro e performance
- Dados de localização (quando autorizado)

## 2. Como Usamos suas Informações

- Processar pedidos e transações
- Personalizar sua experiência
- Enviar notificações relevantes
- Melhorar nossos serviços
- Suporte ao cliente

## 3. Compartilhamento de Dados

Não vendemos ou alugamos suas informações pessoais. Compartilhamos dados apenas:
- Com provedores de serviço confiáveis
- Quando exigido por lei
- Para proteger nossos direitos

## 4. Segurança

Implementamos medidas de segurança para proteger suas informações:
- Criptografia de dados
- Acesso restrito
- Monitoramento contínuo
- Atualizações regulares de segurança

## 5. Seus Direitos

Você tem o direito de:
- Acessar suas informações
- Corrigir dados incorretos
- Excluir sua conta
- Optar por não receber comunicações

## 6. Cookies e Tecnologias Similares

Usamos cookies e tecnologias similares para:
- Melhorar a funcionalidade
- Analisar o uso
- Personalizar conteúdo

## 7. Alterações nesta Política

Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas.

## 8. Contato

Para questões sobre privacidade:
- E-mail: privacy@crowbar.com
- Website: https://crowbar.com/privacy

---

© 2025 Crowbar Mobile. Todos os direitos reservados.`;

  const privacyDir = path.join(CONFIG.outputDir, 'legal');
  ensureDir(privacyDir);
  
  fs.writeFileSync(path.join(privacyDir, 'privacy-policy.md'), privacyPolicy);
  
  log.success('Generated privacy policy');
  return true;
}

/**
 * Generate terms of service
 */
function generateTermsOfService() {
  log.info('Generating terms of service...');
  
  const termsOfService = `# Termos de Serviço - Crowbar Mobile

**Última atualização:** ${new Date().toLocaleDateString('pt-BR')}

## 1. Aceitação dos Termos

Ao usar o Crowbar Mobile, você concorda com estes termos.

## 2. Descrição do Serviço

O Crowbar Mobile é uma plataforma de caixas misteriosas que oferece:
- Compra de caixas misteriosas
- Sistema de coleções
- Comunidade de usuários
- Suporte ao cliente

## 3. Conta de Usuário

### 3.1 Criação de Conta
- Você deve fornecer informações precisas
- É responsável pela segurança da sua conta
- Deve ter pelo menos 18 anos

### 3.2 Responsabilidades
- Manter suas informações atualizadas
- Não compartilhar credenciais
- Usar o serviço de forma legal

## 4. Compras e Pagamentos

### 4.1 Preços
- Todos os preços estão em reais (BRL)
- Preços podem mudar sem aviso prévio
- Impostos inclusos quando aplicável

### 4.2 Pagamentos
- Pagamentos processados por terceiros seguros
- Reembolsos conforme política específica
- Disputas resolvidas conforme procedimentos

## 5. Conteúdo e Propriedade Intelectual

### 5.1 Nosso Conteúdo
- Todo conteúdo é protegido por direitos autorais
- Uso limitado para fins pessoais
- Proibida reprodução sem autorização

### 5.2 Seu Conteúdo
- Você mantém direitos sobre seu conteúdo
- Nos concede licença para usar conforme necessário
- Deve respeitar direitos de terceiros

## 6. Conduta do Usuário

É proibido:
- Usar o serviço para fins ilegais
- Interferir no funcionamento
- Criar contas falsas
- Assediar outros usuários

## 7. Limitação de Responsabilidade

- Serviço fornecido "como está"
- Não garantimos disponibilidade contínua
- Responsabilidade limitada conforme lei

## 8. Modificações

Podemos modificar estes termos a qualquer momento. Mudanças significativas serão comunicadas.

## 9. Rescisão

Podemos suspender ou encerrar contas que violem estes termos.

## 10. Lei Aplicável

Estes termos são regidos pelas leis brasileiras.

## 11. Contato

Para questões sobre estes termos:
- E-mail: legal@crowbar.com
- Website: https://crowbar.com/terms

---

© 2025 Crowbar Mobile. Todos os direitos reservados.`;

  const legalDir = path.join(CONFIG.outputDir, 'legal');
  ensureDir(legalDir);
  
  fs.writeFileSync(path.join(legalDir, 'terms-of-service.md'), termsOfService);
  
  log.success('Generated terms of service');
  return true;
}

/**
 * Generate submission checklist
 */
function generateSubmissionChecklist() {
  log.info('Generating submission checklist...');
  
  const checklist = `# Checklist de Submissão para App Stores

## 📱 App Store (iOS)

### Preparação
- [ ] Conta Apple Developer ativa
- [ ] Certificados de distribuição configurados
- [ ] Provisioning profiles criados
- [ ] App ID registrado

### Assets
- [ ] Ícone do app (1024x1024)
- [ ] Screenshots para iPhone (1284x2778, 1242x2208)
- [ ] Screenshots para iPad (2048x2732, 1668x2388)
- [ ] Ícones de diferentes tamanhos gerados

### Metadados
- [ ] Nome do app definido
- [ ] Descrição completa
- [ ] Palavras-chave otimizadas
- [ ] Categoria selecionada
- [ ] Classificação etária definida
- [ ] URLs de suporte e marketing
- [ ] Política de privacidade
- [ ] Notas de versão

### Build
- [ ] Build de produção criado
- [ ] Testado em dispositivos reais
- [ ] Performance otimizada
- [ ] Sem crashes ou bugs críticos
- [ ] Compliance com guidelines da Apple

### Submissão
- [ ] Upload via Xcode ou Transporter
- [ ] Informações preenchidas no App Store Connect
- [ ] Build selecionado para review
- [ ] Submetido para análise

## 🤖 Google Play Store (Android)

### Preparação
- [ ] Conta Google Play Console ativa
- [ ] Keystore de produção criado
- [ ] App Bundle (AAB) configurado

### Assets
- [ ] Ícone do app (512x512)
- [ ] Screenshots para telefone (1080x1920)
- [ ] Screenshots para tablet (1200x1920, 1600x2560)
- [ ] Gráfico de destaque (1024x500)
- [ ] Ícone de alta resolução (512x512)

### Metadados
- [ ] Título do app
- [ ] Descrição curta (80 caracteres)
- [ ] Descrição completa
- [ ] Categoria selecionada
- [ ] Tags relevantes
- [ ] Classificação de conteúdo
- [ ] Informações de contato
- [ ] Política de privacidade

### Build
- [ ] AAB de produção criado
- [ ] Assinado com keystore de produção
- [ ] Testado em diferentes dispositivos
- [ ] Performance otimizada
- [ ] Compliance com políticas do Google Play

### Submissão
- [ ] Upload do AAB
- [ ] Informações preenchidas no Console
- [ ] Configuração de distribuição
- [ ] Submetido para análise

## 🔒 Requisitos de Segurança

### Geral
- [ ] Dados sensíveis criptografados
- [ ] Comunicação HTTPS
- [ ] Validação de entrada
- [ ] Tratamento seguro de erros

### iOS Específico
- [ ] App Transport Security configurado
- [ ] Keychain para dados sensíveis
- [ ] Permissões justificadas

### Android Específico
- [ ] Permissões mínimas necessárias
- [ ] ProGuard/R8 configurado
- [ ] Backup de dados seguro

## 📊 Testes Finais

### Funcionalidade
- [ ] Todos os recursos funcionando
- [ ] Fluxos de usuário completos
- [ ] Integração com APIs
- [ ] Pagamentos funcionando

### Performance
- [ ] Tempo de inicialização < 3s
- [ ] Navegação fluida
- [ ] Uso de memória otimizado
- [ ] Bateria otimizada

### Compatibilidade
- [ ] Diferentes tamanhos de tela
- [ ] Versões de OS suportadas
- [ ] Orientações de tela
- [ ] Acessibilidade

## 📋 Pós-Submissão

### Monitoramento
- [ ] Analytics configurado
- [ ] Crash reporting ativo
- [ ] Performance monitoring
- [ ] User feedback tracking

### Suporte
- [ ] Documentação de suporte
- [ ] Canal de atendimento
- [ ] FAQ preparado
- [ ] Processo de bug reports

---

**Data de verificação:** ${new Date().toLocaleDateString('pt-BR')}
**Responsável:** [Nome]
**Status:** [Em Progresso/Completo]`;

  const checklistDir = path.join(CONFIG.outputDir, 'submission');
  ensureDir(checklistDir);
  
  fs.writeFileSync(path.join(checklistDir, 'checklist.md'), checklist);
  
  log.success('Generated submission checklist');
  return true;
}

/**
 * Main function
 */
async function main() {
  log.title('Store Assets Generator');

  try {
    // Ensure output directory exists
    ensureDir(CONFIG.outputDir);

    // Generate all assets
    const tasks = [
      { name: 'App Icons', fn: generateAppIcons },
      { name: 'Feature Graphics', fn: generateFeatureGraphics },
      { name: 'Screenshots', fn: processScreenshots },
      { name: 'Store Listings', fn: generateStoreListings },
      { name: 'Privacy Policy', fn: generatePrivacyPolicy },
      { name: 'Terms of Service', fn: generateTermsOfService },
      { name: 'Submission Checklist', fn: generateSubmissionChecklist },
    ];

    let completedTasks = 0;
    const totalTasks = tasks.length;

    for (const task of tasks) {
      log.info(`Generating ${task.name}...`);
      try {
        if (task.fn()) {
          completedTasks++;
        }
      } catch (error) {
        log.error(`Failed to generate ${task.name}: ${error.message}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    log.title('Generation Summary');
    console.log(`✅ Completed: ${completedTasks}/${totalTasks} tasks`);
    console.log(`📁 Output directory: ${CONFIG.outputDir}`);
    
    if (completedTasks === totalTasks) {
      log.success('All store assets generated successfully!');
      log.info('Next steps:');
      log.info('1. Review generated assets');
      log.info('2. Customize graphics and screenshots');
      log.info('3. Update metadata as needed');
      log.info('4. Follow submission checklist');
    } else {
      log.warning(`${totalTasks - completedTasks} tasks failed. Please check the errors above.`);
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    log.error(`Asset generation failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateAppIcons,
  generateFeatureGraphics,
  processScreenshots,
  generateStoreListings,
  generatePrivacyPolicy,
  generateTermsOfService,
  generateSubmissionChecklist,
};
