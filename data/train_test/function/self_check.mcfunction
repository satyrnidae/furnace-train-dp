# Furnace Minecart Trains, data pack prototype
# Built using mc-build (https://github.com/mc-build/mc-build)
scoreboard players set #ok train_test 1
execute store success score #x train_test run scoreboard players set #probe train.ppx 1
execute unless score #x train_test matches 1 run scoreboard players set #ok train_test 0
execute store success score #x train_test run scoreboard players set #probe train.ppz 1
execute unless score #x train_test matches 1 run scoreboard players set #ok train_test 0
execute store success score #x train_test run scoreboard players set #probe train.svx 1
execute unless score #x train_test matches 1 run scoreboard players set #ok train_test 0
execute store success score #x train_test run scoreboard players set #probe train.svz 1
execute unless score #x train_test matches 1 run scoreboard players set #ok train_test 0
execute store success score #x train_test run scoreboard players set #probe train.dir 1
execute unless score #x train_test matches 1 run scoreboard players set #ok train_test 0
execute store success score #x train_test run scoreboard players set #probe train.gap 1
execute unless score #x train_test matches 1 run scoreboard players set #ok train_test 0
execute store success score #x train_test run scoreboard players set #probe train.chk 1
execute unless score #x train_test matches 1 run scoreboard players set #ok train_test 0
execute unless score #period train.const matches 20 run scoreboard players set #ok train_test 0
execute unless score #reach train.const matches 16 run scoreboard players set #ok train_test 0
execute unless score #stop train.const matches 2500 run scoreboard players set #ok train_test 0
execute unless score #hit train.const matches 100 run scoreboard players set #ok train_test 0
execute unless score #10 train.const matches 10 run scoreboard players set #ok train_test 0
execute unless score #noavoid train.const matches 0 run scoreboard players set #ok train_test 0
execute at @e[tag=tt.origin,limit=1] run summon minecraft:hopper_minecart ~ ~ ~ {Tags:["tt","tt.probe"]}
execute at @e[tag=tt.origin,limit=1] run summon minecraft:tnt_minecart ~ ~ ~ {Tags:["tt","tt.probe"]}
execute at @e[tag=tt.origin,limit=1] run summon minecraft:spawner_minecart ~ ~ ~ {Tags:["tt","tt.probe"]}
execute at @e[tag=tt.origin,limit=1] run summon minecraft:command_block_minecart ~ ~ ~ {Tags:["tt","tt.probe"]}
execute store result score #n train_test if entity @e[type=#train:carts,tag=tt.probe]
execute unless score #n train_test matches 4 run scoreboard players set #ok train_test 0
function train_test:lib/cleanup
data modify storage train_test:cur name set value "t0 shared state"
function train_test:lib/report with storage train_test:cur