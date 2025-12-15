const mineflayer = require('mineflayer')
// --- RENDER UCHUN KOD ---
const express = require('express')
const app = express()
const port = process.env.PORT || 3000

app.get('/', (req, res) => res.send('Bot ishlayapti!'))
app.listen(port, () => console.log(`Web server http://localhost:${port} da ishga tushdi`))
// ------------------------

// KUTUBXONALAR
const pathfinderModule = require('mineflayer-pathfinder')
const autoEatModule = require('mineflayer-auto-eat')
const pvpModule = require('mineflayer-pvp')
const collectBlockModule = require('mineflayer-collectblock')
const toolModule = require('mineflayer-tool')

const pathfinderPlugin = pathfinderModule.pathfinder
const autoEatPlugin = autoEatModule.plugin || autoEatModule
const pvpPlugin = pvpModule.plugin || pvpModule
const collectBlockPlugin = collectBlockModule.plugin || collectBlockModule
const toolPlugin = toolModule.plugin || toolModule
const { Movements, goals } = pathfinderModule

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

  bot.loadPlugin(pathfinderPlugin)
  bot.loadPlugin(autoEatPlugin)
  bot.loadPlugin(pvpPlugin)
  bot.loadPlugin(collectBlockPlugin)
  bot.loadPlugin(toolPlugin)

  bot.on('spawn', () => {
    console.log('Bot serverga kirdi!')
    
    // Serverga kirgach komandalar
    setTimeout(() => bot.chat('/warp botuy'), 3000) 
    setTimeout(() => bot.chat('/mvtp XisHelperMap'), 6000)
    
    // Harakatlanish sozlamalari
    const defaultMove = new Movements(bot)
    defaultMove.allowParkour = false 
    defaultMove.canDig = true
    bot.pathfinder.setMovements(defaultMove)

    // Ovqatlanish sozlamalari
    bot.autoEat.options.priority = 'foodPoints'
    bot.autoEat.options.startAt = 14
    bot.autoEat.options.bannedFood = []

    // 10 soniyadan keyin ishni boshlaydi
    setTimeout(() => {
        console.log("Survival va Jang rejimi boshlandi!")
        survivalIsActive = true
        mainLoop() // Asosiy sikl
    }, 10000)
  })

  // Bot o'lsa xabar berish
  bot.on('death', () => console.log("Bot o'ldi va qayta tug'iladi."))
  
  // Zombini o'ldirib bo'lgach yana ishga qaytish
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
        // 1. DUSHMANNI TEKSHIRISH (Eng muhimi)
        // Agar bot hozir jang qilayotgan bo'lsa, tsiklni to'xtatib turamiz
        if (bot.pvp.target) {
            setTimeout(mainLoop, 1000)
            return
        }

        // Atrofdagi 20 blok ichidagi dushmanni qidirish
        const dushman = bot.nearestEntity(e => 
            e.type === 'mob' && 
            e.position.distanceTo(bot.entity.position) < 20 && 
            (e.name === 'zombie' || e.name === 'skeleton' || e.name === 'spider' || e.name === 'creeper')
        )

        if (dushman) {
            console.log(`${dushman.name} topildi! Hujumga o'taman...`)
            
            // Agar bot biror narsa qaziyotgan bo'lsa to'xtatamiz
            if (bot.pathfinder.isMoving()) bot.pathfinder.stop()
            
            // Qilich olish
            const sword = bot.inventory.items().find(item => item.name.includes('sword'))
            if (sword) await bot.equip(sword, 'hand')

            // Hujum qilish
            await bot.pvp.attack(dushman)
            
            // Jang tugashini kutish shart emas, keyingi siklda yana tekshiradi
            setTimeout(mainLoop, 500)
            return
        }

        // 2. AGAR DUSHMAN BO'LMASA -> BLOK YIG'ISH YOKI YURISH
        const block = bot.findBlock({
            matching: (blk) => blk.name.includes('log') || blk.name === 'dirt',
            maxDistance: 32
        })

        if (block) {
            // Blokni olishga borish (CollectBlock)
            // Biz collectBlockni to'g'ridan-to'g'ri ishlatmaymiz, chunki u bloklanib qolishi mumkin.
            // Shuning uchun oddiyroq tekshiramiz.
            if (bot.collectBlock) {
                 await bot.collectBlock.collect(block) // Bu funksiya uzoq vaqt olishi mumkin
            }
        } else {
            // Blok yo'q bo'lsa, aylanib yurish
            const x = bot.entity.position.x + (Math.random() * 10 - 5)
            const z = bot.entity.position.z + (Math.random() * 10 - 5)
            await bot.pathfinder.goto(new goals.GoalBlock(x, bot.entity.position.y, z))
        }

    } catch (err) {
        // Agar xatolik bo'lsa (masalan, pathfinder yo'l topa olmasa), shunchaki o'tkazib yuboramiz
        // console.log("Kichik xatolik:", err.message)
    }

    // 1 soniyadan keyin qayta tekshirish
    setTimeout(mainLoop, 1000)
}

// 5 daqiqalik anti-afk chat
setInterval(() => {
    if(bot && bot.entity) {
        bot.chat('/warp botuy')
    }
}, 300000)

startBot()
