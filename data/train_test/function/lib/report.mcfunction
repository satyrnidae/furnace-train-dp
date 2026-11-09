# Furnace Minecart Trains, data pack prototype
# Built using mc-build (https://github.com/mc-build/mc-build)
$execute if score #ok train_test matches 1 run tellraw @a [{"text":"PASS ","color":"green"},{"text":"$(name)"}]
$execute unless score #ok train_test matches 1 run tellraw @a [{"text":"FAIL ","color":"red"},{"text":"$(name)"}]