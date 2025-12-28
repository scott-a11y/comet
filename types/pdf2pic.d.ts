declare module 'pdf2pic' {
  export function fromPath(
    filePath: string,
    options?: {
      density?: number;
      saveFilename?: string;
      savePath?: string;
      format?: string;
      width?: number;
      height?: number;
    }
  ): (
    page: number,
    convertOptions?: { responseType?: 'base64' | 'image' | 'buffer' }
  ) => Promise<{ base64: string }>;
}
