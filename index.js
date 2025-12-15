const mineflayer = require('mineflayer')
// --- RENDER UCHUN KOD ---
const express = require('express')
const app = express()
const port = process.env.PORT || 3000

app.get('/', (req, res) => res.send('Bot ishlayapti!'))
app.listen(port, () => console.log(`Web server http://localhost:${port} da ishga tushdi`))
// ------------------------

// KUTUBXONALARNI TO'G'RI IMPORT QILISH
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const pvp = require('mineflayer-pvp').plugin
const autoEat = require('mineflayer-auto-eat').plugin
const collectBlock = require('mineflayer-collectblock').plugin
const tool = require('mineflayer-tool').plugin

const botOptions = {
  host: 'jigar_.aternos.me',
  port: 25565,
  username: 'XisHelperBot',
  version: false // Avtomatik versiya
}

let bot
let survivalIsActive = false 

function startBot() {
  console.log('Bot serverga ulanmoqda...')
  bot = mineflayer.createBot(botOptions)

  // PLAGINLARNI XAVFSIZ YUKLASH
  // Agar plagin noto'g'ri bo'lsa, bot o'chib qolmaydi
  try {
      if (pathfinder) bot.loadPlugin(pathfinder)
      if (pvp) bot.loadPlugin(pvp)
      if (autoEat) bot.loadPlugin(autoEat)
      if (collectBlock) bot.loadPlugin(collectBlock)
      if (tool) bot.loadPlugin(tool)
  } catch (err) {
      console.log('Plagin yuklashda xatolik (lekin bot ishlashda davom etadi):', err.message)
  }

  bot.on('spawn', () => {
    console.log('Bot serverga kirdi!')
    
    // Serverga kirgach komandalar
    setTimeout(() => bot.chat('/warp botuy'), 3000) 
    setTimeout(() => bot.chat('/mvtp XisHelperMap'), 6000)
    
    // Harakatlanish sozlamalari (Pathfinder yuklangan bo'lsa)
    if (bot.pathfinder) {
        const defaultMove = new Movements(bot)
        defaultMove.allowParkour = false 
        defaultMove.canDig = true
        bot.pathfinder.setMovements(defaultMove)
    }

    // Ovqatlanish sozlamalari
    if (bot.autoEat) {
        bot.autoEat.options.priority = 'foodPoints'
        bot.autoEat.options.startAt = 14
        bot.autoEat.options.bannedFood = []
    }

    // 10 soniyadan keyin ishni boshlaydi
    setTimeout(() => {
        console.log("Survival va Jang rejimi boshlandi!")
        survivalIsActive = true
        mainLoop() // Asosiy sikl
    }, 10000)
  })

  bot.on('death', () => console.log("Bot o'ldi va qayta tug'iladi."))
  
  bot.on('mob_killed', (loot) => {
      console.log("Dushman o'ldirildi!")
      bot.chat("Dushmanni yo'q qildim!")
  })

  bot.on('end', (reason) => {
    console.log(`Bot uzildi: ${reason}. Qayta ulanaman...`)
    setTimeout(startBot, 10000)
  })

  bot.on('error', (err) => console.log(`Xatolik: ${err.message}`))
}

// Asosiy mantiq (Jang + Ishlash)
async function mainLoop() {
    if (!bot || !bot.entity || !survivalIsActive) return

    try {
        // 1. DUSHMANNI TEKSHIRISH
        if (bot.pvp && bot.pvp.target) {
            setTimeout(mainLoop, 1000)
            return
        }

        // Atrofdagi 20 blok ichidagi dushmanni qidirish
        const dushman = bot.nearestEntity(e => 
            e.type === 'mob' && 
            e.position.distanceTo(bot.entity.position) < 20 && 
            (e.name === 'zombie' || e.name === 'skeleton' || e.name === 'spider' || e.name === 'creeper')
        )

        if (dushman && bot.pvp) {
            console.log(`${dushman.name} topildi! Hujumga o'taman...`)
            
            if (bot.pathfinder && bot.pathfinder.isMoving()) bot.pathfinder.stop()
            
            const sword = bot.inventory.items().find(item => item.name.includes('sword'))
            if (sword) await bot.equip(sword, 'hand')

            await bot.pvp.attack(dushman)
            
            setTimeout(mainLoop, 500)
            return
        }

        // 2. JANG BO'LMASA -> AYLANIB YURISH
        if (bot.pathfinder) {
            const x = bot.entity.position.x + (Math.random() * 10 - 5)
            const z = bot.entity.position.z + (Math.random() * 10 - 5)
            await bot.pathfinder.goto(new goals.GoalBlock(x, bot.entity.position.y, z))
        }

    } catch (err) {
        // Xatolik bo'lsa indamaymiz
    }

    setTimeout(mainLoop, 1000)
}

// 5 daqiqalik anti-afk
setInterval(() => {
    if(bot && bot.entity) {
        bot.chat('/warp botuy')
    }
}, 300000)

startBot()
