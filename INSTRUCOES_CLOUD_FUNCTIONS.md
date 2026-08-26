# Instruções de Instalação e Deploy das Firebase Cloud Functions

## 1. Instalar Dependências NPM

Navegue até a pasta `functions` e instale as dependências:

```bash
cd functions
npm install
```

## 2. Pacotes Necessários

O `package.json` já inclui todas as dependências necessárias:

- **firebase-admin**: ^12.0.0 - SDK Admin do Firebase
- **firebase-functions**: ^4.5.0 - SDK do Firebase Functions
- **ua-parser-js**: ^1.0.37 - Parser de User-Agent para detectar dispositivo, SO e navegador
- **axios**: ^1.6.0 - Cliente HTTP para geolocalização por IP

## 3. Configurar Firebase

Se ainda não configurou o Firebase no projeto:

```bash
# Instalar Firebase CLI (se ainda não tiver)
npm install -g firebase-tools

# Login no Firebase
firebase login

# Inicializar o projeto (se ainda não fez)
firebase init
```

Durante a inicialização, selecione:
- **Functions**: Yes
- **Firestore**: Yes
- **Hosting**: Yes (opcional)

## 4. Estrutura de Regras do Firestore

Adicione as seguintes regras de segurança no Firestore para proteger a coleção `historico_acessos`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Coleção de histórico de acessos
    match /historico_acessos/{acessoId} {
      // Leitura: apenas usuários autenticados
      allow read: if request.auth != null;
      
      // Escrita: apenas a Cloud Function pode escrever
      allow write: if false;
    }
    
    // Outras coleções existentes...
    match /lula_users_v2/{userId} {
      allow read, write: if request.auth != null || request.auth.token.admin == true;
    }
    
    match /lula_device_reservations/{deviceId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 5. Deploy das Cloud Functions

Para fazer deploy das funções:

```bash
# Deploy apenas das functions
firebase deploy --only functions

# Deploy de tudo (functions + hosting + firestore)
firebase deploy
```

## 6. Como Usar no Frontend

### 6.1 Registrar Acesso ao Fazer Login

No seu código de login (em `js/auth.js`), adicione a chamada à Cloud Function:

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

// Após login bem-sucedido
async function registrarAcessoLogin(email) {
  const functions = getFunctions();
  const registrarAcesso = httpsCallable(functions, 'registrarAcessoLogin');
  
  try {
    const result = await registrarAcesso({ email });
    console.log('Acesso registrado:', result.data);
  } catch (error) {
    console.error('Erro ao registrar acesso:', error);
  }
}

// Chamar após login
await registrarAcessoLogin(user.email);
```

### 6.2 Obter Histórico com Filtros

```javascript
async function obterHistoricoAcessos(filtros = {}) {
  const functions = getFunctions();
  const obterHistorico = httpsCallable(functions, 'obterHistoricoAcessos');
  
  const result = await obterHistorico({
    dispositivo: 'mobile', // opcional: 'desktop', 'mobile', 'tablet'
    sistemaOperacional: 'Android', // opcional: 'Windows', 'Android', 'iOS', 'macOS', 'Linux'
    navegador: 'Chrome', // opcional: 'Chrome', 'Safari', 'Firefox', 'Edge', 'Opera'
    tipoAcesso: 'human', // opcional: 'human', 'bot'
    pais: 'BR', // opcional: código ISO do país
    limite: 100 // opcional: número máximo de registros
  });
  
  return result.data.acessos;
}
```

### 6.3 Obter Estatísticas

```javascript
async function obterEstatisticas(dias = 30) {
  const functions = getFunctions();
  const obterEstatisticas = httpsCallable(functions, 'obterEstatisticasAcessos');
  
  const result = await obterEstatisticas({ dias });
  return result.data.estatisticas;
}
```

## 7. Estrutura dos Dados Salvos

Cada acesso é salvo com a seguinte estrutura:

```javascript
{
  uid: "string",           // UID do usuário Firebase
  email: "string",         // Email do usuário
  timestamp: Timestamp,    // Timestamp do servidor
  ip: "string",            // Endereço IP
  geolocalizacao: {
    cidade: "string",
    pais: "string",
    codigoPais: "string", // Ex: "BR", "US"
    lat: number,
    lon: number
  },
  dispositivo: {
    tipo: "string",        // "desktop", "mobile", "tablet"
    modelo: "string",
    vendor: "string"
  },
  sistemaOperacional: {
    nome: "string",        // "Windows", "Android", "iOS", "macOS", "Linux"
    versao: "string"
  },
  navegador: {
    nome: "string",        // "Chrome", "Safari", "Firefox", "Edge", "Opera"
    versao: "string",
    engine: "string"
  },
  tipoAcesso: "string",    // "human" ou "bot"
  userAgent: "string"      // User-Agent completo (limitado a 500 chars)
}
```

## 8. Monitoramento

Para ver os logs das Cloud Functions:

```bash
# Ver todos os logs
firebase functions:log

# Ver logs de uma função específica
firebase functions:log --only registrarAcessoLogin
```

## 9. Custos Estimados

- **Firestore**: $0.18/GB armazenado + $0.06/100K leituras + $0.18/100K escritas
- **Cloud Functions**: Plano Blaze (paga) necessário para funções HTTP
  - 125K invocações grátis/mês
  - 40GB-seconds de CPU grátis/mês
  - Após: $0.40/milhão de invocações + $0.00001/GB-second

Para um jogo com ~1000 logins/dia:
- Firestore: ~$0.50-1.00/mês
- Cloud Functions: Gratuito (dentro do limite gratuito)

## 10. Notas Importantes

1. **Geolocalização**: Usa ip-api gratuito (sem API key). Para produção, considere usar um serviço pago mais confiável.
2. **Rate Limiting**: Considere adicionar rate limiting nas funções para evitar abuso.
3. **Privacidade**: Certifique-se de estar em conformidade com LGPD/GDPR ao coletar dados de IP e geolocalização.
4. **Bots**: A detecção de bots é baseada em heurísticas do User-Agent e pode não ser 100% precisa.
