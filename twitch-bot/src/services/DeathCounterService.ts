import axios from 'axios';

const API_URL = process.env.API_URL;

export interface DeathCounterResponse {
  game: string;
  totalDeaths: number;
  sessionDeaths: number;
}

export async function addDeaths(
  amount: number,
): Promise<DeathCounterResponse | null> {
  try {
    const { data } = await axios.post<DeathCounterResponse>(
      `${API_URL}/death-counter/add`,
      { amount },
    );

    return data;
  } catch (error) {
    console.error('[DEATH COUNTER ERROR]:', (error as Error).message);
    return null;
  }
}

export async function getDeaths(): Promise<DeathCounterResponse | null> {
  try {
    const { data } = await axios.get<DeathCounterResponse>(
      `${API_URL}/death-counter`,
    );

    return data;
  } catch (error) {
    console.error('[DEATH COUNTER ERROR]:', (error as Error).message);
    return null;
  }
}

export async function resetDeaths(): Promise<DeathCounterResponse | null> {
  try {
    const { data } = await axios.post<DeathCounterResponse>(
      `${API_URL}/death-counter/reset`,
    );

    return data;
  } catch (error) {
    console.error('[DEATH COUNTER ERROR]:', (error as Error).message);
    return null;
  }
}
