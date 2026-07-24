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
 * Passo 2: Buscar Transações
 * Usa o token para buscar as transações da sua conta conectada.
 * @param accountId - O ID da sua conta no Pluggy
 */
export async function fetchPluggyTransactions(accountId: string) {
  const token = await getPluggyToken();
  
  if (!token) {
    throw new Error('Não foi possível obter o token do Pluggy.');
  }

  try {
    const response = await fetch(`${PLUGGY_API_URL}/transactions?accountId=${accountId}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': token, // Passamos o token no header
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await response.json();
    return data.results; // Retorna a lista de compras/pix
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    return [];
  }
}

/**
 * Passo Extra: Buscar Contas (Para pegar o accountId)
 */
export async function fetchPluggyAccounts() {
  const token = await getPluggyToken();
  if (!token) return [];

  try {
    const response = await fetch(`${PLUGGY_API_URL}/accounts`, {
      method: 'GET',
      headers: { 'X-API-KEY': token },
      cache: 'no-store',
    });

    const data = await response.json();
    return data.results; 
  } catch (error) {
    console.error('Erro ao buscar contas:', error);
    return [];
  }
}
