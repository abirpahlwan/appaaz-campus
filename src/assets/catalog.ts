// @ts-nocheck
/* Ported from the legacy single-file script (mechanical split). */


/* Kenney Nature Kit (CC0, assets/kenney/nature/): OBJ+MTL parsed at runtime,
   height-normalized so one scale fits the tile world. No textures needed —
   Kenney OBJs carry flat material colors. */
export const FLORA = {
  tree_default:['tree_default',24], tree_oak:['tree_oak',22], pine:['tree_pineDefaultA',30],
  rock:['rock_smallA',8], flowerR:['flower_redA',6], flowerY:['flower_yellowA',6],
  flowerP:['flower_purpleA',6], grass:['grass_large',7], bush:['plant_bush',9]
};
/* Kitbashed building/vehicle models (CC0 Kenney packs), same OBJ+MTL pipeline as
   FLORA. train/arcade OBJs are UV-colormap textured upstream, so the copies in
   assets/kenney/<pack>/ were baked offline to flat per-face Kd colors (no PNGs,
   no parser changes). targetH chosen so footprints land on the 16px tile grid.
   3D-houses region. */
export const KIT3D = {
  dish:['space/satelliteDish',9],
  steps:['furniture/stairsOpenSingle',6], doormat:['furniture/rugDoormat',0.25],
  track:['train/track-single',2.4], loco:['train/train-electric-city-a',14], carriage:['train/train-carriage-box',13],
  cabinet:['arcade/arcade-machine',14],
  rBase:['space/rocket_baseA',8], rBody:['space/rocket_sidesA',16], rTop:['space/rocket_topA',12], rFins:['space/rocket_finsA',12],
  doorWin:['modular/building-door-window',24], winN:['modular/building-corner-window-narrow',8],
  winM:['modular/building-corner-window-middle',8], barr:['building/barricade-doorway-a',18],
  firepit:['survival/campfire-pit',4], bedroll:['survival/bedroll',3], crate:['survival/box',8],
  crateL:['survival/box-large',8], cask:['survival/barrel',9],
  glassTop:['commercial/building-skyscraper-c',24], glassPane:['retro/window-wide-type-a',10],
  rail:['retro/balcony-type-a',3], plantBox:['retro/roof-metal-type-a',10],
  mast:['retro/detail-light-single',12],
  /* Industrial kit (solarpunk) */
  solarFlat:['industrial/solar-panel-flat',4], solarLand:['industrial/solar-panel-landscape',5],
  solarPort:['industrial/solar-panel-portrait',5], solarLandG:['industrial/solar-panel-landscape-group',10],
  solarPortG:['industrial/solar-panel-portrait-group',10],
  windmill:['industrial/windmill',35], windmillLow:['industrial/windmill-low',25],
  waterTower:['industrial/water-tower',28],
  containerA:['industrial/shipping-container-a',10], containerB:['industrial/shipping-container-b',10],
  containerC:['industrial/shipping-container-c',10],
  chimney:['industrial/chimney-basic',14], tank:['industrial/detail-tank',8], tankL:['industrial/detail-tank-large',12],
  /* Suburban kit */
  fence:['suburban/fence',6], fence4:['suburban/fence-1x4',6],
  planter:['suburban/planter',5], subTreeL:['suburban/tree-large',18], subTreeS:['suburban/tree-small',12],
  pathStones:['suburban/path-stones',0.5],
  /* Cube Pets */
  cubBunny:['cube-pets/animal-bunny',5], cubCat:['cube-pets/animal-cat',5],
  cubDog:['cube-pets/animal-dog',5], cubFox:['cube-pets/animal-fox',5],
  cubPenguin:['cube-pets/animal-penguin',5], cubParrot:['cube-pets/animal-parrot',4],
  /* Bridges */
  bridgeStone:['nature/bridge_stone',8], bridgeWood:['nature/bridge_wood',7],
  bridgeCenter:['nature/bridge_center_stone',8], bridgeSide:['nature/bridge_side_stone',6],
  /* River/Path tiles */
  riverStr:['nature/riverStraight',1], riverBend:['nature/riverBend',1],
  pathStr:['nature/pathStraight',1], pathCross:['nature/pathCross',1],
  /* Road furniture (no road meshes) */
  /* Vehicles */
  truckG:['retro/truck-green',10], truckGC:['retro/truck-green-cargo',10],
  truckGr:['retro/truck-grey',10], truckFlat:['retro/truck-flat',8],
  /* Street furniture */
  benchR:['retro/bench',4], lightDbl:['retro/light-double',8], lightTraffic:['retro/light-traffic',8],
  dumpster:['retro/dumpster',5],
  /* Nature extras */
  rockLA:['nature/rock_largeA',10], rockLB:['nature/rock_largeB',12],
  tentS:['nature/tent_small',6], tentD:['nature/tent_detailed',8],
  campfireS:['nature/campfire_stones',3], signP:['nature/sign',6],
  obelisk:['nature/obelisk',14], palm:['nature/tree_palm',18],
  lilyL:['nature/lily_large',2], lilyS:['nature/lily_small',1.5],
  fenceS:['nature/fence_simple',4], fenceL:['nature/fence_low',2.5],
  mushR:['nature/mushroom_red',2.5], logN:['nature/log',4], stumpN:['nature/stump',3],
  /* Commercial extras */
  awning:['commercial/awning',5], parasol:['commercial/parasol',6],
  smBuildA:['commercial/sm-building-a',18], smBuildB:['commercial/sm-building-b',20],
  /* Modular extras */
  houseA:['modular/house-a',22], houseB:['modular/house-b',24], acUnit:['modular/ac-unit',3],
  /* Furniture extras */
  benchF:['furniture/bench2',4], lampF:['furniture/lamp',5],
  pottedP:['furniture/pottedPlant',4], trashF:['furniture/trashcan',4],
  plantS:['furniture/plantSmall',3], plantS2:['furniture/plantSmall2',3], plantS3:['furniture/plantSmall3',3],
  /* Watercraft */
  boatSailA:['watercraft/boat-sail-a',10], boatSailB:['watercraft/boat-sail-b',10],
  boatSpdA:['watercraft/boat-speed-a',6], boatSpdC:['watercraft/boat-speed-c',6],
  boatRowL:['watercraft/boat-row-large',5], boatRowS:['watercraft/boat-row-small',4],
  boatTug:['watercraft/boat-tug-a',8], boatFish:['watercraft/boat-fishing',5],
  boatHouse:['watercraft/boat-house-a',8], shipCargo:['watercraft/ship-cargo-a',12],
  shipSm:['watercraft/ship-small',10], buoyW:['watercraft/buoy',3],
  cargoCont:['watercraft/cargo-container-a',6],
  /* Survival (recolored) */
  barrelS:['survival/barrel',9], barrelO:['survival/barrel-open',9],
  boxS:['survival/box',8], boxLg:['survival/box-large',8], boxOp:['survival/box-open',8],
  bedrollF:['survival/bedroll-frame',5], bedrollPk:['survival/bedroll-packed',5],
  bucket:['survival/bucket',5], campPit:['survival/campfire-pit',4],
  campFish:['survival/campfire-fishing-stand',5], campStand:['survival/campfire-stand',4],
  fenceSv:['survival/fence',6], fenceFrt:['survival/fence-fortified',8],
  fenceDw:['survival/fence-doorway',6], fishLg:['survival/fish-large',4],
  grassA:['survival/grass',4], grassLg:['survival/grass-large',6],
  patchG:['survival/patch-grass',3], patchGLg:['survival/patch-grass-large',5],
  logA:['survival/tree-log',6], logSm:['survival/tree-log-small',4],
  pickaxe:['survival/tool-pickaxe',5], shovel:['survival/tool-shovel',4],
  signSv:['survival/signpost',5], signSvS:['survival/signpost-single',4],
  rockSvA:['survival/rock-a',7], rockSvB:['survival/rock-b',8],
  rockSvC:['survival/rock-c',7], rockFlat:['survival/rock-flat',5],
  tentSv:['survival/tent',6], tentCv:['survival/tent-canvas',6],
  workbench:['survival/workbench',5], workAnv:['survival/workbench-anvil',5],
  resourceW:['survival/resource-wood',4], resourceS:['survival/resource-stone',4],
  resourceP:['survival/resource-planks',4],
  /* Building kit (recolored) */
  barricadeA:['building/barricade-doorway-a',18], barricadeB:['building/barricade-doorway-b',18],
  barricadeW:['building/barricade-window-a',14],
  border:['building/border',8], borderC:['building/border-corner',6],
  borderH:['building/border-high',12], borderHC:['building/border-high-corner',8],
  column:['building/column',12], columnW:['building/column-wide',14],
  detailPipe:['building/detail-pipe',6],
  /* Modular (recolored) */
  bBlock:['modular/building-block',20], bDoor:['modular/building-door',20],
  bWinW:['modular/building-window-wide',12], bWinL:['modular/building-window-large',12],
  bWinN:['modular/building-window',8], bWinBal:['modular/building-window-balcony',10],
  bRoofFlat:['modular/roof-flat-center',20], bRoofGable:['modular/roof-gable',16],
  bRoofSlant:['modular/roof-slanted',14], bSteps:['modular/building-steps-wide',10],
  bCorner:['modular/building-corner',18], bHouseA:['modular/building-sample-house-a',22],
  bHouseB:['modular/building-sample-house-b',24], bTowerA:['modular/building-sample-tower-a',26],
  doorB:['modular/door-brown',14], doorW:['modular/door-white',14],
  /* Arcade (recolored) */
  arcadeCab:['arcade/arcade-machine',14], pinball:['arcade/pinball',12],
  airHockey:['arcade/air-hockey',10], clawMach:['arcade/claw-machine',10],
  danceMach:['arcade/dance-machine',10], cashReg:['arcade/cash-register',6],
  prizes:['arcade/prizes',5], ticketMach:['arcade/ticket-machine',8],
  vendingMach:['arcade/vending-machine',8], gamblingMach:['arcade/gambling-machine',8],
  /* Factory */
  conveyor:['factory/conveyor',5], conveyorC:['factory/conveyor-corner',5],
  conveyorX:['factory/conveyor-cross',5], conveyorSt:['factory/conveyor-stripe',5],
  crane:['factory/crane',18], craneLift:['factory/crane-lift',12],
  catwalk:['factory/catwalk-straight',6], catwalkStair:['factory/catwalk-stairs',8],
  pipeL:['factory/pipe-large',6], pipeLBend:['factory/pipe-large-bend',6],
  machine:['factory/machine',8], hopper:['factory/hopper-round',6],
  cogA:['factory/cog-a',4],
  /* Pirate */
  pirateShipL:['pirate/ship-pirate-large',14], pirateShipM:['pirate/ship-pirate-medium',12],
  shipWreck:['pirate/ship-wreck',10], castleWall:['pirate/castle-wall',8],
  castleGate:['pirate/castle-gate',10], towerL:['pirate/tower-complete-large',14],
  towerS:['pirate/tower-complete-small',10], cannon:['pirate/cannon',5],
  cannonMv:['pirate/cannon-mobile',5], barrelP:['pirate/barrel',4],
  chestP:['pirate/chest',3], mastP:['pirate/mast',10], dockP:['pirate/dock',3],
  /* Cave */
  caveCorr:['cave/corridor',6], caveCorrC:['cave/corridor-corner',6],
  caveCorrI:['cave/corridor-intersection',6], caveRoomL:['cave/room-large',8],
  caveRoomS:['cave/room-small',6], caveGateR:['cave/gate-rock',8],
  caveGateM:['cave/gate-metal-bars',8], caveStair:['cave/stairs',6],
  caveLadder:['cave/ladder',5], caveFloor:['cave/template-floor',1],
  caveWall:['cave/template-wall',6], caveCorrW:['cave/corridor-wide',6]
};