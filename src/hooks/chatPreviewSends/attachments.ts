/**
 * File attach / drop / video-note glue for the chat preview composer. It only
 * normalises the browser event shapes; the actual transfer lives in sendFile.
 */

interface AttachmentHandlerDeps {
  sendFile: (file: File, opts?: { silent?: boolean; videoNote?: boolean }) => Promise<unknown>;
  sendFiles: (files: File[], opts?: { silent?: boolean }) => Promise<unknown>;
}

export function createAttachmentHandlers({ sendFile, sendFiles }: AttachmentHandlerDeps) {
  const attachFiles = (files: File[], _chatData: any, _onUpdChat: ((c: any) => void) | undefined, silent: boolean) => {
    if (files.length === 1) {
      void sendFile(files[0], { silent });
    } else if (files.length > 1) {
      void sendFiles(files, { silent });
    }
  };

  const sendVideoNote = (file: File) => {
    void sendFile(file, { silent: false, videoNote: true });
  };

  const handleImageAttach = (e: React.ChangeEvent<HTMLInputElement>, chatData: any, onUpdChat: ((c: any) => void) | undefined, silent: boolean) => {
    const files = e.target.files ? [...e.target.files] : [];
    if (files.length === 0) return;
    attachFiles(files, chatData, onUpdChat, silent);
  };

  const handleFileDrop = (files: FileList | null | undefined, chatData: any, onUpdChat: ((c: any) => void) | undefined) => {
    const arr = files ? [...files] : [];
    if (arr.length === 0) return;
    attachFiles(arr, chatData, onUpdChat, false);
  };

  return { attachFiles, sendVideoNote, handleImageAttach, handleFileDrop };
}
