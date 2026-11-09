// TODO: Manual review needed. Please delete this line after review.
// Test manifest. Read by gametest/generate.js for the structures, environments and instances, and imported by src/train_test.mcb for the
// poll function of each test.
// Every test is one test instance with its own environment, so tests run one at a time. The structure holds a start test block, a
// command block the start block powers, an accept test block and a fail test block. The command block repeats a poll function, which
// counts ticks and runs the steps below. A step is [age, function under train_test], age 1 is the first tick. Before each step the
// score #ok train_test is 1, a step fails the test by setting it to 0. The last step passing accepts the test.
// All scenarios build their stage at the origin marker, 6 blocks south of the command block, see lib/begin in train_test.mcb.
const gametest = {
	size: [48, 6, 11],
	// Ticks added to the last step for max_ticks
	margin: 30,
	tests: [
		{ id: "t0_shared_state", steps: [[1, "t0/run"]] },
		{ id: "t1_sampler", steps: [[1, "t1/start"], [6, "t1/check"], [9, "t1/tp"], [10, "t1/check_tp"], [13, "t1/roots"]] },
		{ id: "trace_curve", steps: [[1, "trace/each_curve"]] },
		{ id: "trace_up", steps: [[1, "trace/each_up"]] },
		{ id: "trace_down", steps: [[1, "trace/each_down"]] },
		{ id: "trace_clear", steps: [[1, "trace/each_clear"]] },
		{ id: "trace_modded", steps: [[1, "trace/each_modded"]] },
		{ id: "trace_own_train", steps: [[1, "trace/each_own_train"]] },
		{ id: "trace_shapes", steps: [[1, "trace/each_shapes"]] },
		{ id: "t2_parked_cart", steps: [[1, "t2/start"], [401, "t2/check"]] },
		{ id: "t3_parked_train", steps: [[1, "t3/start"], [401, "t3/check"]] },
		{ id: "t4_resume", steps: [[1, "t4/start"], [301, "t4/pop"], [421, "t4/check"]] },
		{ id: "t5_stagger", steps: [[1, "t5/start"], [46, "t5/check"]] },
		{ id: "t6_no_heading", steps: [[1, "t6/start"], [61, "t6/check"]] },
		{ id: "t7_own_block", steps: [[1, "t7/start"]] },
		{ id: "t8_curve_stop", steps: [[1, "t8/start"], [501, "t8/check"]] },
		{ id: "t9_slope_stop", steps: [[1, "t9/start"], [501, "t9/check"]] },
		{ id: "t10_head_on", steps: [[1, "t10/start"], [301, "t10/check"]] },
		{ id: "t11_slow_contact", steps: [[1, "t11/start"], [61, "t11/check"]] },
		{ id: "t12_same_train", steps: [[1, "t12/start"]] },
		{ id: "t13_fresh_spawn", steps: [[1, "t13/start"], [6, "t13/check"]] },
		{ id: "t14_boom_survivor", steps: [[1, "t14/start"]] },
	],
};

module.exports = { gametest };
