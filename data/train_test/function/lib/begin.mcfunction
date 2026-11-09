# Furnace Minecart Trains, data pack prototype
# Built using mc-build (https://github.com/mc-build/mc-build)
function train_test:lib/cleanup
kill @e[tag=tt.origin]
scoreboard players set #noavoid train.const 0
execute align xyz positioned ~0.5 ~ ~0.5 run summon minecraft:marker ~ ~ ~ {Tags:["tt","tt.origin"]}