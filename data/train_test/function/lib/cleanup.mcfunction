# Furnace Minecart Trains, data pack prototype
# Built using mc-build (https://github.com/mc-build/mc-build)
kill @e[tag=tt,tag=!tt.origin]
execute at @e[tag=tt.origin,limit=1] run kill @e[type=minecraft:item,distance=..64]