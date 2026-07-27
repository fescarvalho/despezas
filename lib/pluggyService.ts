import { Transaction, Account } from '@/types';

const PLUGGY_API_URL = process.env.PLUGGY_API_URL || 'https://api.pluggy.ai';

/**
 * Passo 1: Autenticação
 * Troca o Client ID e Secret por um Token de Acesso temporário (API Key).
 */
export async function getPluggyToken(): Promise<string | null> {
  try {
    const response = await fetch(`${PLUGGY_API_URL}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: process.env.PLUGGY_CLIENT_ID,
        clientSecret: process.env.PLUGGY_CLIENT_SECRET,
      }),
      // Evita cache na autenticação
      cache: 'no-store',
    });

    const data = await response.json();
    
    if (!response.ok) throw new Error(data.message || 'Erro ao autenticar no Pluggy');
    
    return data.apiKey; // Retorna o token para usarmos nas próximas chamadas
  } catch (error) {
    console.error('Erro na autenticação do Pluggy:', error);
    return null;
  }
}

/**
 * Passo 2: Criar Connect Token
 * Esse token é usado pelo Widget no Frontend para autenticar o usuário no banco
 */
export async function createPluggyConnectToken(): Promise<string | null> {
  const token = await getPluggyToken();
  if (!token) return null;

  try {
    const response = await fetch(`${PLUGGY_API_URL}/connect_token`, {
      method: 'POST',
      headers: {
        'X-API-KEY': token,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao criar connect token');
    
    return data.accessToken;
  } catch (error) {
    console.error('Erro ao gerar connect token:', error);
    return null;
  }
}

/**
 * Passo 2.5: Buscar Empréstimos
 * @param {string} itemId - O ID da sua conexão no Pluggy
 */
export async function fetchPluggyLoans(itemId: string) {
  const token = await getPluggyToken()
  if (!token) return []

  try {
    const response = await fetch(`${PLUGGY_API_URL}/loans?itemId=${itemId}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': token,
        'Accept': 'application/json',
      },
    })
    const responseData = await response.json()

    if (!response.ok || responseData.errorId) {
      console.error('Erro do Pluggy (Loans):', responseData)
      return []
    }

    return responseData.results || []
  } catch (error) {
    console.error('fetchPluggyLoans Error:', error)
    return []
  }
}

/**
 * Passo 3: Buscar Transações
 * Usa o token para buscar as transações da sua conta conectada.
 * @param accountId - O ID da sua conta no Pluggy
 */

export async function fetchPluggyTransactions(accountId: string) {
  const token = await getPluggyToken();
  
  if (!token) {
    throw new Error('Não foi possível obter o token do Pluggy.');
  }

  try {
    const response = await fetch(`${PLUGGY_API_URL}/v2/transactions?accountId=${accountId}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': token, // Passamos o token no header
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await response.json();
    if (!response.ok || data.errorId) {
      console.warn('Pluggy API Error on transactions:', data);
      return [];
    }
    return data.results || []; // Retorna a lista de compras/pix
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    return [];
  }
}

/**
 * Passo Extra: Buscar o status do Item (Conexão)
 */
export async function fetchPluggyItem(itemId: string) {
  const token = await getPluggyToken();
  if (!token) return null;

  try {
    const response = await fetch(`${PLUGGY_API_URL}/items/${itemId}`, {
      method: 'GET',
      headers: { 'X-API-KEY': token },
      cache: 'no-store',
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar item');
    return data;
  } catch (error) {
    console.error('Erro ao buscar item:', error);
    return null;
  }
}

/**
 * Passo Extra: Buscar Contas de uma conexão (Item) específica
 */
export async function fetchPluggyAccounts(itemId: string) {
  const token = await getPluggyToken();
  if (!token) return [];

  try {
    const response = await fetch(`${PLUGGY_API_URL}/accounts?itemId=${itemId}`, {
      method: 'GET',
      headers: { 'X-API-KEY': token },
      cache: 'no-store',
    });

    const data = await response.json();
    if (!response.ok || data.errorId) {
      console.warn('Pluggy API Error:', data);
      throw new Error(data.message || 'Erro ao buscar contas');
    }
    return data.results || []; 
  } catch (error: any) {
    console.error('Erro ao buscar contas:', error);
    throw error;
  }
}

/**
 * Buscar Taxonomia de Categorias da Pluggy
 */
export async function fetchPluggyCategories() {
  const token = await getPluggyToken();
  if (!token) return [];

  try {
    const response = await fetch(`${PLUGGY_API_URL}/categories`, {
      method: 'GET',
      headers: { 'X-API-KEY': token, 'Accept': 'application/json' },
      cache: 'no-store',
    });

    const data = await response.json();
    if (!response.ok || data.errorId) {
      console.warn('Pluggy API Error on categories:', data);
      return [];
    }
    return data.results || [];
  } catch (error) {
    console.error('Erro ao buscar categorias do Pluggy:', error);
    return [];
  }
}
