const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')

// For js-ipfs >= 0.38

// Create IPFS instance
const initIPFSInstance = async () => {
  return await IPFS.create({
    repo: '/orbitdb/',
    start: true,
    preload: {
      enabled: false
    },
    EXPERIMENTAL: {
      pubsub: true,
    },
    config: {
      Addresses: {
        Swarm: [
          // Use IPFS dev signal server
          '/dns4/secure-beyond-12878.herokuapp.com/tcp/80/ws/p2p-webrtc-star/',
           '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star',
          '/dns4/webrtc-star.discovery.libp2p.io/tcp/443/wss/p2p-webrtc-star',
          '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
          '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star'
          //'/ip4/127.0.0.1/tcp/13579/wss/p2p-webrtc-star'
        ]
      },
    }
  });
};



const load = async (db, statusText) => {
  // Set the status text
  console.log(statusText)

  // When the database is ready (ie. loaded), display results
  db.events.on('ready', () => queryAndRender(db))
  // When database gets replicated with a peer, display results
  db.events.on('replicated', () => queryAndRender(db))
  // When we update the database, display result
  db.events.on('write', () => queryAndRender(db))

  db.events.on('replicate.progress', () => queryAndRender(db))

  // Hook up to the load progress event and render the progress
  let maxTotal = 0,
    loaded = 0
  db.events.on('load.progress', (address, hash, entry, progress, total) => {
    loaded++
    maxTotal = Math.max.apply(null, [maxTotal, progress, 0])
    total = Math.max.apply(null, [progress, maxTotal, total, entry.clock.time, 0])
    console.log(`Loading database... ${maxTotal} / ${total}`)
  })

  db.events.on('ready', () => {
    // Set the status text
    setTimeout(() => {
      console.log('Database is ready')
    }, 1000)
  })

  // Load locally persisted database
  await db.load()
}

const startWriter = async (db, interval) => {
  // Set the status text
  console.log(`Writing to database every ${interval} milliseconds...`)

  // Start update/insert loop
  updateInterval = setInterval(async () => {
    try {
      await update(db)
    } catch (e) {
      console.error(e.toString())
      writerText.innerHTML = '<span style="color: red">' + e.toString() + '</span>'
      clearInterval(updateInterval)
    }
  }, interval)
}

const resetDatabase = async (db) => {
  writerText.innerHTML = ""
  outputElm.innerHTML = ""
  outputHeaderElm.innerHTML = ""

  clearInterval(updateInterval)

  if (db) {
    await db.close()
  }

  interval = Math.floor((Math.random() * 300) + (Math.random() * 2000))
}

const createDatabase = async () => {
  await resetDatabase(db)

  openButton.disabled = true
  createButton.disabled = true

  try {
    const name = dbnameField.value
    const type = createType.value
    const publicAccess = publicCheckbox.checked

    db = await orbitdb.open(name, {
      // If database doesn't exist, create it
      create: true,
      overwrite: true,
      // Load only the local version of the database, 
      // don't load the latest from the network yet
      localOnly: false,
      type: type,
      // If "Public" flag is set, allow anyone to write to the database,
      // otherwise only the creator of the database can write
      accessController: {
        write: publicAccess ? ['*'] : [orbitdb.identity.id],
      }
    })

    await load(db, 'Creating database...')
    startWriter(db, interval)
  } catch (e) {
    console.error(e)
  }
  openButton.disabled = false
  createButton.disabled = false
}

const openDatabase = async () => {
  const address = dbAddressField.value

  await resetDatabase(db)

  openButton.disabled = true
  createButton.disabled = true

  try {
    statusElm.innerHTML = "Connecting to peers..."
    db = await orbitdb.open(address, {
      sync: true
    })
    await load(db, 'Loading database...')

    if (!readonlyCheckbox.checked) {
      startWriter(db, interval)
    } else {
      writerText.innerHTML = `Listening for updates to the database...`
    }
  } catch (e) {
    console.error(e)
  }
  openButton.disabled = false
  createButton.disabled = false
}

const update = async (db) => {

  const time = new Date().toISOString()


  await db.set('mykey', time)
}

const query = (db) => {
  return db.get('mykey')
}

const queryAndRender = async (db) => {
  const networkPeers = await window.node.swarm.peers()
  const databasePeers = await window.node.pubsub.peers(db.address.toString())

  const result = query(db)

  dbType = db.type;
  dbAddress = db.address;

  console.log(`
<h2>${dbType.toUpperCase()}</h2>
<h3 id="remoteAddress">${dbAddress}</h3>
<p>Copy this address and use the 'Open Remote Database' in another browser to replicate this database between peers.</p>
`)

  console.log(`
<div><b>Peer ID:</b> ${orbitdb.id}</div>
<div><b>Peers (database/network):</b> ${databasePeers.length} / ${networkPeers.length}</div>
<div><b>Oplog Size:</b> ${Math.max(db._replicationStatus.progress, db._oplog.length)} / ${db._replicationStatus.max}</div>
<h2>Results</h2>
<div id="results">
<div>
${result && Array.isArray(result) && result.length > 0 && db.type !== 'docstore' && db.type !== 'keyvalue'
? result.slice().reverse().map((e) => e.payload.value).join('<br>\n')
: db.type === 'docstore'
  ? JSON.stringify(result, null, 2)
  : result ? result.toString().replace('"', '').replace('"', '') : result
}
</div>
</div>
`)
}


initIPFSInstance().then(async ipfs => {
  var db = await orbitdb.open("test", {
    // If database doesn't exist, create it
    create: true,
    overwrite: true,
    // Load only the local version of the database, 
    // don't load the latest from the network yet
    localOnly: false,
    type: 'keyvalue',
    // If "Public" flag is set, allow anyone to write to the database,
    // otherwise only the creator of the database can write
    accessController: {
      write: ['*'],
    }
  })

  await load(db, 'Creating database...')
  startWriter(db, interval)


  //   const orbitdb = await OrbitDB.createInstance(ipfs);
  //   console.log("1")
  //   // Create / Open a database
  // //   con/st db = await orbitdb.log("hello");
  //   const db = await orbitdb.open("/orbitdb/zdpuAp2ZthtbiECNgbTyuUazbQ3xTejnxTRT6D9JXrt7LzfQY/test", {
  //         sync: true
  //     })
  //     console.log("2")
  //   await db.load();
  //   console.log("3")
  //   // Listen for updates from peers
  //   db.events.on("replicated", address => {
  //     console.log(db.iterator({ limit: -1 }).collect());
  //   });

  //   // Add an entry
  //   const hash = await db.add("world");
  //   console.log(hash);

  // Query
  const result = db.iterator({
    limit: 10
  }).collect();
  console.log(JSON.stringify(result, null, 2));
}).catch(err => console.log(err));