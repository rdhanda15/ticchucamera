import * as mediasoup from 'mediasoup';

class MediasoupService {
  private workers: mediasoup.types.Worker[] = [];
  private routers: Map<string, mediasoup.types.Router> = new Map();
  private transports: Map<string, Map<string, mediasoup.types.WebRtcTransport>> = new Map();
  private producers: Map<string, Map<string, mediasoup.types.Producer>> = new Map();
  private consumers: Map<string, Map<string, mediasoup.types.Consumer>> = new Map();

  async createWorker() {
    const worker = await mediasoup.createWorker();
    this.workers.push(worker);
    worker.on('died', () => {
      console.error('worker died, exiting in 5 seconds...');
      setTimeout(() => process.exit(1), 5000);
    });
    return worker;
  }

  async createRouter(worker: mediasoup.types.Worker) {
    return await worker.createRouter({ mediaCodecs: [] });
  }

  async createWebRtcTransport(router: mediasoup.types.Router, userId: string) {
    let transports = this.transports.get(router.id);
    if (!transports) {
      transports = new Map();
      this.transports.set(router.id, transports);
    }

    const transport = await router.createWebRtcTransport({
      listenIps: [{ ip: '0.0.0.0', announcedIp: 'your_public_ip_here' }],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: 1000000,
    });

    transports.set(userId, transport);

    transport.on('dtlsstatechange', (dtlsState) => {
      if (dtlsState === 'closed') {
        transport.close();
        transports.delete(userId);
      }
    });

    return transport;
  }
}
