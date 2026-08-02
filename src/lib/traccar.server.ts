type TraccarDevice = {
  id: number;
  name: string;
  uniqueId: string;
  status: string;
  lastUpdate?: string;
};

type TraccarPosition = {
  deviceId: number;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  address?: string | null;
  deviceTime?: string;
  fixTime?: string;
};

function authHeader(username: string, token: string) {
  if (username) {
    const basic = btoa(`${username}:${token}`);
    return { Authorization: `Basic ${basic}` };
  }
  return { Authorization: `Bearer ${token}` };
}

export async function fetchTraccar(
  baseUrl: string,
  username: string,
  token: string,
): Promise<{ devices: TraccarDevice[]; positions: TraccarPosition[] }> {
  const root = baseUrl.replace(/\/+$/, "");
  const headers = { Accept: "application/json", ...authHeader(username, token) };

  const [devicesRes, positionsRes] = await Promise.all([
    fetch(`${root}/api/devices`, { headers }),
    fetch(`${root}/api/positions`, { headers }),
  ]);

  if (!devicesRes.ok) {
    throw new Error(`Traccar /api/devices [${devicesRes.status}]: ${await devicesRes.text()}`);
  }
  if (!positionsRes.ok) {
    throw new Error(`Traccar /api/positions [${positionsRes.status}]: ${await positionsRes.text()}`);
  }

  return {
    devices: (await devicesRes.json()) as TraccarDevice[],
    positions: (await positionsRes.json()) as TraccarPosition[],
  };
}

// Traccar reports speed in knots
export function knotsToKmh(speed: number) {
  return Math.round(speed * 1.852 * 10) / 10;
}