// Bot FSM - Finite State Machine for bots

export interface State {
  name: string;
  transitions: Map<string, string>;
}

export interface FSMState {
  currentState: string;
  history: string[];
}

export type FSMStorage = {
  get(key: string): Promise<FSMState | null>;
  set(key: string, state: FSMState): Promise<void>;
  delete(key: string): Promise<void>;
};

export class BotFSM {
  private states: Map<string, State> = new Map();
  private currentStates: Map<string, FSMState> = new Map();
  private storage: FSMStorage;

  constructor(storage?: FSMStorage) {
    this.storage = storage || {
      get: () => Promise.resolve(null),
      set: () => Promise.resolve(),
      delete: () => Promise.resolve(),
    };
  }

  addState(state: State): void {
    this.states.set(state.name, state);
  }

  async transition(botId: string, event: string): Promise<{ success: boolean; newState?: string }> {
    const currentState = this.currentStates.get(botId) || { currentState: 'initial', history: [] };

    const state = this.states.get(currentState.currentState);
    if (!state) {
      return { success: false };
    }

    const nextState = state.transitions.get(event);
    if (!nextState) {
      return { success: false };
    }

    const newState: FSMState = {
      currentState: nextState,
      history: [...currentState.history, event],
    };

    this.currentStates.set(botId, newState);
    await this.storage.set(botId, newState);

    return { success: true, newState: nextState };
  }

  getState(botId: string): FSMState | null {
    return this.currentStates.get(botId) || null;
  }

  loadState(botId: string): Promise<void> {
    return this.storage.get(botId).then((state) => {
      if (state) {
        this.currentStates.set(botId, state);
      }
    });
  }
}

export class InMemoryFSMStorage implements FSMStorage {
  private states: Map<string, FSMState> = new Map();

  async get(key: string): Promise<FSMState | null> {
    return this.states.get(key) || null;
  }

  async set(key: string, state: FSMState): Promise<void> {
    this.states.set(key, state);
  }

  async delete(key: string): Promise<void> {
    this.states.delete(key);
  }
}

export class LocalStorageFSMStorage implements FSMStorage {
  private prefix = '__bot_fsm_';

  async get(key: string): Promise<FSMState | null> {
    try {
      const stored = localStorage.getItem(this.prefix + key);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, state: FSMState): Promise<void> {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(state));
    } catch {
      // Storage full
    }
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(this.prefix + key);
  }
}
