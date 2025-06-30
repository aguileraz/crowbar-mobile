# Crowbar Mobile (React Native)

![Crowbar Logo](https://raw.githubusercontent.com/aguileraz/crowbar-backend/main/public/images/logo.png)

Aplicativo multiplataforma (Android & iOS) para o marketplace de caixas misteriosas Crowbar. Desenvolvido com React Native para uma experiência de usuário moderna e unificada, integrando-se com o [Crowbar Backend](https://github.com/aguileraz/crowbar-backend).

## 📋 Índice

- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Setup do Ambiente](#-setup-do-ambiente)
- [Executando a Aplicação](#-executando-a-aplicação)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Contribuindo](#-contribuindo)

## ✨ Tecnologias

Este projeto utiliza uma stack moderna de desenvolvimento mobile:

- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Framework**: [React](https://reactjs.org/) & [React Native](https://reactnative.dev/)
- **Navegação**: [React Navigation](https://reactnavigation.org/)
- **Gerenciamento de Estado**: [Redux Toolkit](https://redux-toolkit.js.org/)
- **Requisições HTTP**: [Axios](https://axios-http.com/)
- **Componentes de UI**: [React Native Paper](https://reactnativepaper.com/) (Material Design 3)
- **Integração com Firebase**: [React Native Firebase](https://rnfirebase.io/)
- **Formulários**: [Formik](https://formik.org/) & [Yup](https://github.com/jquense/yup)
- **Animações**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)

## 🛠️ Pré-requisitos

Antes de começar, certifique-se de que você tem o ambiente de desenvolvimento React Native configurado.

- **Node.js**: `v18.19.0` ou superior (use NVM para gerenciar versões)
- **Yarn** ou **npm**
- **Watchman**: `brew install watchman` (recomendado para macOS)
- **React Native CLI**: `npm install -g react-native-cli`
- **Ambiente de Desenvolvimento Mobile**:
  - **iOS**: Xcode e CocoaPods
  - **Android**: Android Studio, JDK e Android SDK

Siga o guia oficial do React Native para configurar o ambiente de desenvolvimento: **React Native Environment Setup**.

## 🚀 Setup do Ambiente

Siga os passos abaixo para configurar e executar o projeto localmente.

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/crowbar-mobile.git
    cd crowbar-mobile
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    # ou
    yarn install
    ```

3.  **Instale os Pods (apenas para iOS):**
    ```bash
    cd ios
    pod install
    cd ..
    ```

4.  **Configure o Firebase:**
    - **Android**: Baixe o arquivo `google-services.json` do seu projeto Firebase e coloque-o em `android/app/`.
    - **iOS**: Baixe o arquivo `GoogleService-Info.plist` do seu projeto Firebase e adicione-o ao seu projeto no Xcode.

5.  **Configure as Variáveis de Ambiente:**
    - Crie uma cópia do arquivo `.env.example` e renomeie para `.env`.
      ```bash
      cp .env.example .env
      ```
    - Preencha as variáveis no arquivo `.env` com as URLs corretas do backend. Veja a seção Variáveis de Ambiente.

## 🏃 Executando a Aplicação

Após o setup, você pode iniciar a aplicação em um emulador/simulador ou dispositivo físico.

### Para Android

```bash
npm run android
# ou
yarn android
```

### Para iOS

```bash
npm run ios
# ou
yarn ios
```

## ⚙️ Variáveis de Ambiente

As variáveis de ambiente são gerenciadas através de um arquivo `.env` na raiz do projeto.

**`.env.example`**
```
# URL base da API do backend
API_BASE_URL=https://crowbar-backend-staging.azurewebsites.net/api/v1

# URL do servidor Socket.IO
SOCKET_URL=https://crowbar-backend-staging.azurewebsites.net/
```

## 📁 Estrutura do Projeto

A estrutura de pastas do projeto segue um padrão focado em features e modularidade:

```
crowbar-mobile/
└── src/
    ├── api/          # Configuração do Axios e chamadas de API
    ├── assets/       # Imagens, fontes, etc.
    ├── components/   # Componentes reutilizáveis (Button, Card, etc.)
    ├── config/       # Configurações gerais do app
    ├── hooks/        # Hooks customizados
    ├── navigation/   # Stacks de navegação (React Navigation)
    ├── screens/      # Telas principais da aplicação
    ├── store/        # Configuração do Redux (actions, reducers, slices)
    ├── theme/        # Tema da aplicação (cores, fontes)
    ├── types/        # Definições de tipos TypeScript
    └── utils/        # Funções utilitárias
```

## 📜 Scripts Disponíveis

- `npm start`: Inicia o Metro Bundler.
- `npm test`: Executa os testes com Jest.
- `npm run lint`: Executa o ESLint para verificar a qualidade do código.
- `npm run lint:fix`: Tenta corrigir automaticamente os problemas encontrados pelo ESLint.

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, siga os seguintes passos:

1.  Faça um fork do projeto.
2.  Crie uma nova branch (`git checkout -b feature/nova-feature`).
3.  Faça commit das suas alterações (`git commit -m 'Adiciona nova feature'`).
4.  Faça push para a branch (`git push origin feature/nova-feature`).
5.  Abra um Pull Request.