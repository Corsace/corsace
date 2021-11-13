declare global {
  namespace Express {
    interface User {
      ID: number;
    }
  }
}

export {}; // needed to allow global declaration
