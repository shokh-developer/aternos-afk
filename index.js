const mineflayer = require('mineflayer')

// --- RENDER UCHUN KOD (WEB SERVER) ---
const express = require('express')
const app = express()
const port = process.env.PORT || 3000

app.get('/', (req, res) => res.send('Bot 24/7 ishlamoqda!'))
app.listen(port, () => console.log(`Web server http://localhost:${port} da ishga tushdi`))
// -------------------------------------

// KUTUBXONALARNI XAVFSIZ CHAQIRIB OLISH
const pathfinderModule = require('mineflayer-pathfinder')
const pvpModule = require('mineflayer-pvp')
const autoEatModule = require('mineflayer-auto-eat')
const collectBlockModule = require('mineflayer-collectblock')
const toolModule = require('mineflayer-tool')

// Plaginlarni to'g'ri ajratib olish (Universal usul)
const pathfinder = pathfinderModule.pathfinder
const Movements = pathfinderModule.Movements
const goals = pathfinderModule.goals
const pvp = pvpModule.plugin || pvpModule
const autoEat = autoEatModule.plugin || autoEatModule
const collectBlock = collectBlockModule.plugin || collectBlockModule
const tool = toolModule.plugin || toolModule

const botOptions = {
  host: 'jigar_.aternos.me', 
  port: 25565,             // DIQQAT: Aternosda port har doim o'zgaradi! Saytdan tekshiring.
  username: 'XisHelperBot',
  version: false           // Avtomatik versiya
}

let bot
let survivalIsActive = false 

function startBot() {
  console.log('Bot serverga ulanmoqda...')
  bot = mineflayer.createBot(botOptions)

  // PLAGINLARNI YUKLASH
  loadPluginSafe(bot, pathfinder, 'Pathfinder')
  loadPluginSafe(bot, pvp, 'PvP')
  loadPluginSafe(bot, autoEat, 'AutoEat')
  loadPluginSafe(bot, collectBlock, 'CollectBlock')
  loadPluginSafe(bot, tool, 'Tool')

  bot.on('spawn', () => {
    console.log('Bot serverga kirdi!')
    
    // Serverga kirgach komandalar
    setTimeout(() => bot.chat('/warp botuy'), 5000) 
    setTimeout(() => bot.chat('/mvtp XisHelperMap'), 10000)
    
    // Harakatlanish sozlamalari
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
        bot.autoEat.options.bannedFood = ['rotten_flesh', 'spider_eye']
    }

    // 15 soniyadan keyin ishni boshlaydi
    setTimeout(() => {
        console.log("Survival va Jang rejimi faollashdi!")
        survivalIsActive = true
        mainLoop() 
    }, 15000)
  })

  bot.on('death', () => console.log("Bot o'ldi va qayta tug'iladi."))
  
  bot.on('kicked', console.log)
  
  bot.on('end', (reason) => {
    console.log(`Bot uzildi: ${reason}. 10 soniyadan keyin qayta ulanaman...`)
    setTimeout(startBot, 10000)
  })

  bot.on('error', (err) => console.log(`Xatolik: ${err.message}`))
}

// Plagin yuklash uchun yordamchi funksiya (Xatolikni oldini oladi)
function loadPluginSafe(botInstance, pluginFunction, name) {
    try {
        if (typeof pluginFunction === 'function') {
            botInstance.loadPlugin(pluginFunction)
            console.log(`${name} plagini yuklandi.`)
        } else {
            console.log(`Ogohlantirish: ${name} plagini yuklanmadi (funksiya emas).`)
        }
    } catch (e) {
        console.log(`${name} yuklashda xato: ${e.message}`)
    }
}

// ASOSIY SIKL (JANG VA YURISH)
async function mainLoop() {
    if (!bot || !bot.entity || !survivalIsActive) return

    try {
        // 1. JANG HOLATINI TEKSHIRISH
        if (bot.pvp && bot.pvp.target) {
            // Agar jang qilayotgan bo'lsa, xalaqit bermaymiz
            setTimeout(mainLoop, 1000)
            return
        }

        // 2. DUSHMAN QIDIRISH (20 blok radiusda)
        const dushman = bot.nearestEntity(e => {
            if (e.type !== 'mob') return false
            // Dushman nomini kichik harflarda tekshiramiz (ishonchliroq)
            const name = e.name.toLowerCase() // yoki e.mobType
            const enemies = ['zombie', 'skeleton', 'spider', 'creeper', 'husk']
            return enemies.includes(name) && e.position.distanceTo(bot.entity.position) < 20
        })

        if (dushman) {
            console.log(`${dushman.name} topildi! Hujum...`)
            
            // Yurishni to'xtatish
            if (bot.pathfinder && bot.pathfinder.isMoving()) bot.pathfinder.stop()
            
            // Qilich olish
            const sword = bot.inventory.items().find(item => item.name.includes('sword'))
            if (sword) await bot.equip(sword, 'hand')

            // Hujum qilish
            if (bot.pvp) {
                await bot.pvp.attack(dushman)
            }
        } else {
            // 3. DUSHMAN YO'Q BO'LSA - AYLANI B YURISH
            if (bot.pathfinder && !bot.pathfinder.isMoving()) {
                const r = 10 // Yurish radiusi
                const x = bot.entity.position.x + (Math.random() * r * 2 - r)
                const z = bot.entity.position.z + (Math.random() * r * 2 - r)
                
                // Boroladigan joymi tekshirish shart emas, pathfinder o'zi hal qiladi
                await bot.pathfinder.goto(new goals.GoalBlock(x, bot.entity.position.y, z)).catch(() => {})
            }
        }

    } catch (err) {
        // Xatolik bo'lsa bot to'xtab qolmasligi kerak
        // console.log('Siklda kichik xato:', err.message)
    }

    // Qayta tekshirish tezligi (1 soniya)
    setTimeout(mainLoop, 1000)
}

// 5 daqiqalik Anti-AFK
setInterval(() => {
    if(bot && bot.entity) {
        bot.chat('/warp botuy')
        bot.swingArm('right')
    }
}, 300000)

// Node.js xatolikdan o'chib qolmasligi uchun
process.on('uncaughtException', (err) => console.log('Kritik xato ushlandi:', err))
process.on('unhandledRejection', (err) => console.log('Va\'da xatosi:', err))

startBot()
