import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:4000/api';

export interface AttendanceResponse {
  totalCheckIns: number;
  isNewCheckIn: boolean;
}

export async function registerAttendance(
  twitchId: string,
  username: string,
): Promise<AttendanceResponse | null> {
  try {
    const { data } = await axios.post<AttendanceResponse>(
      `${API_URL}/attendance/register`,
      {
        twitchId,
        username,
      },
    );

    return data;
  } catch (error) {
    console.error(
      '[REGISTER ATTENDANCE SERVICE ERROR]:',
      (error as Error).message,
    );
    return null;
  }
}
