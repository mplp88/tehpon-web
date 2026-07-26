import axios from 'axios';

export interface CommandFromApi {
  _id: string;
  name: string; // ej: "!rickroll"
  description: string;
  category: 'social' | 'overlay' | 'rpg' | 'utilidad';
  isActive: boolean;
  chatResponse?: string; // ej: "🎶 ¡@{user} acaba de rickrollear al stream!"
  media?: {
    soundFile?: string;
    imageFile?: string;
  };
  cooldown?: number; // en segundos
}

export class CommandManager {
  private apiUrl: string;
  // Caché local en memoria: Key = "!rickroll"
  private cache: Map<string, CommandFromApi> = new Map();
  // Registro de tiempos para cooldown por comando: Key = "!rickroll", Value = timestamp (ms)
  private cooldowns: Map<string, number> = new Map();

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  public async loadCommands(): Promise<void> {
    try {
      const url = `${this.apiUrl}/api/commands`;
      console.log(`[TehPonBot] Descargando los comandos de ${url}`);
      const response = await axios.get<CommandFromApi[]>(url);
      const commands = response.data;

      this.cache.clear();
      commands.forEach((cmd) => {
        if (cmd.isActive) {
          this.cache.set(cmd.name.toLowerCase(), cmd);
        }
      });

      console.log(
        `[CommandManager] ${this.cache.size} comandos cargados en memoria.`,
      );
    } catch (error) {
      console.error(
        '[CommandManager Error] No se pudieron cargar los comandos desde la API:',
        (error as Error).message,
      );
    }
  }

  public getCommand(name: string): CommandFromApi | undefined {
    return this.cache.get(name.toLowerCase());
  }

  public checkCooldown(commandName: string): number {
    const cmd = this.getCommand(commandName);
    if (!cmd || !cmd.cooldown || cmd.cooldown <= 0) return 0;

    const key = commandName.toLowerCase();
    const lastUsed = this.cooldowns.get(key) || 0;
    const now = Date.now();
    const elapsed = now - lastUsed;
    const cooldownMs = cmd.cooldown * 1000;

    if (elapsed < cooldownMs) {
      return Math.ceil((cooldownMs - elapsed) / 1000);
    }

    return 0;
  }

  public registerUsage(commandName: string): void {
    this.cooldowns.set(commandName.toLowerCase(), Date.now());
  }

  public formatMessage(template: string, username: string): string {
    return template
      .replace(/{user}/gi, username)
      .replace(/{username}/gi, username);
  }

  public getCommandsListMessage(): string {
    const names = Array.from(this.cache.keys());
    if (names.length === 0) {
      return 'No hay comandos activos en este momento.';
    }
    return `Comandos disponibles: ${names.join(', ')}`;
  }
}
