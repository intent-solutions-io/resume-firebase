// Type declarations for mammoth
// https://github.com/mwilliamson/mammoth.js

declare module 'mammoth' {
  interface Message {
    type: 'warning' | 'error';
    message: string;
  }

  interface Result {
    value: string;
    messages: Message[];
  }

  interface Options {
    buffer?: Buffer;
    path?: string;
    arrayBuffer?: ArrayBuffer;
  }

  function extractRawText(options: Options): Promise<Result>;
  function convertToHtml(options: Options): Promise<Result>;
  function convertToMarkdown(options: Options): Promise<Result>;

  export { extractRawText, convertToHtml, convertToMarkdown, Result, Message, Options };
  export default { extractRawText, convertToHtml, convertToMarkdown };
}
