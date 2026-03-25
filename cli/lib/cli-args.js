export function extractClientTabId(argv) {
  const args = [];
  let clientTabId;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--clientTabId') {
      clientTabId = argv[i + 1];
      i += 1;
      continue;
    }
    if (a.startsWith('--clientTabId=')) {
      clientTabId = a.slice('--clientTabId='.length);
      continue;
    }
    args.push(a);
  }

  return { args, clientTabId };
}

export function cdpTargetOptions(clientTabId) {
  return clientTabId ? { clientTabId } : {};
}
