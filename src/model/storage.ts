export const STORAGE = {
  projectsIndex: "tm:projects:index",
  projectKey: (id: string) => `tm:project:${id}`,
  snapshotsKey: (id: string) => `tm:project:${id}:snapshots`
};
