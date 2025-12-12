const mineflayer = require('mineflayer')
// --- RENDER UCHUN QO'SHIMCHA KOD (BOSHLANDI) ---
const express = require('express')
const app = express()
const port = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.send('Bot ishlayapti! 24/7 rejim faol.')
})

app.listen(port, () => {
  console.log(`Web server http://localhost:${port} da ishga tushdi`)
})
// --- RENDER UCHUN KOD (TUGADI) ---

// KUTUBXONALAR
const pathfinderModule = require('mineflayer-pathfinder')
const autoEatModule = require('mineflayer-auto-eat')
const pvpModule = require('mineflayer-pvp')
const collectBlockModule = require('mineflayer-collectblock')
const toolModule = require('mineflayer-tool')

// Plaginlarni olish
const pathfinderPlugin = pathfinderModule.pathfinder
const autoEatPlugin = autoEatModule.plugin || autoEatModule
const pvpPlugin = pvpModule.plugin || pvpModule
const collectBlockPlugin = collectBlockModule.plugin || collectBlockModule
const toolPlugin = toolModule.plugin || toolModule
const { Movements, goals } = pathfinderModule

// SERVER SOZLAMALARI
const botOptions = {
  host: 'jigar_.aternos.me', // <-- IP NI YOZISHNI UNUTMANG
  port: 25565,
  username: 'XisHelperBot',
  version: false
}

let bot
let survivalIsActive = false 

function startBot() {
  console.log('Bot serverga ulanmoqda...')
  bot = mineflayer.createBot(botOptions)

  loadPluginSafe(bot, pathfinderPlugin, 'Pathfinder')
  loadPluginSafe(bot, autoEatPlugin, 'AutoEat')
  loadPluginSafe(bot, pvpPlugin, 'PvP')
  loadPluginSafe(bot, collectBlockPlugin, 'CollectBlock')
  loadPluginSafe(bot, toolPlugin, 'Tool')

  bot.on('spawn', () => {
    console.log('Bot serverga kirdi!')
    
    setTimeout(() => bot.chat('/warp botuy'), 2000) 
    setTimeout(() => bot.chat('/mvtp XisHelperMap'), 4000)
    
    if (bot.pathfinder) {
        const defaultMove = new Movements(bot)
        defaultMove.allowParkour = false 
        defaultMove.canDig = true
        bot.pathfinder.setMovements(defaultMove)
    }

    if (bot.autoEat) {
        bot.autoEat.options.priority = 'foodPoints'
        bot.autoEat.options.startAt = 14
        bot.autoEat.options.bannedFood = []
    }

    setTimeout(() => {
        console.log("Survival boshlandi!")
        survivalIsActive = true
        survivalLoop()
    }, 10000)
  })

  bot.on('physicTick', () => {
    if (!bot || !bot.pvp || !survivalIsActive) return
    if (!bot.pvp.target) {
        const dushman = bot.nearestEntity(e => 
            e.type === 'mob' && 
            e.position.distanceTo(bot.entity.position) < 5 && 
            (e.mobType === 'Zombie' || e.mobType === 'Skeleton')
        )
        if (dushman) bot.pvp.attack(dushman)
    }
  })

  bot.on('end', (reason) => {
    console.log(`Bot uzildi: ${reason}. Qayta ulanaman...`)
    setTimeout(startBot, 10000)
  })

  bot.on('error', (err) => console.log(`Xatolik: ${err.message}`))
}

function loadPluginSafe(botInstance, plugin, name) {
    if (typeof plugin === 'function') {
        botInstance.loadPlugin(plugin)
    }
}

async function survivalLoop() {
    if (!bot || !bot.entity || !survivalIsActive) return
    try {
        if (bot.pvp && bot.pvp.target) {
            setTimeout(survivalLoop, 1000); return
        }
        const block = bot.findBlock({
            matching: (blk) => blk.name.includes('log') || blk.name === 'dirt',
            maxDistance: 32
        })

        if (block && bot.collectBlock) {
            await bot.collectBlock.collect(block)
        } else if (bot.pathfinder) {
            const x = bot.entity.position.x + (Math.random() * 6 - 3)
            const z = bot.entity.position.z + (Math.random() * 6 - 3)
            await bot.pathfinder.goto(new goals.GoalBlock(x, bot.entity.position.y, z))
        }
    } catch (err) {}
    setTimeout(survivalLoop, 2000)
}

// 5 daqiqalik profilaktika
setInterval(() => {
    if(bot) {
        bot.chat('/warp botuy')
    }
}, 300000)


startBot()
