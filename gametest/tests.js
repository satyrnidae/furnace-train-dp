// Test manifest. Read by gametest/generate.js for the structures, environments and instances, and imported by src/train_test.mcb for the
// poll function of each test.
// Every test is one test instance with its own environment, but the runner starts them all at once, and the scenarios share one arena, tags and
// scores. So each test gets a window on a global tick clock, start below, and its poll does nothing before it. Windows do not overlap,
// and a test that fails or times out can't hold up the next one. The clock only runs once the arena chunks are loaded, see gt_tick in
// generate.js. The structure holds a start test block, a
// command block the start block powers, an accept test block and a fail test block. The command block repeats a poll function, which
// counts ticks and runs the steps below. A step is [age, function under train_test], age 1 is the first tick. Before each step the
// score #ok train_test is 1, a step fails the test by setting it to 0. The last step passing accepts the test.
// All scenarios build their stage at the origin marker at 100 64 100, see lib/begin in train_test.mcb. The structure is only the scaffold.
// t33 polls the follower every 3 ticks while the pair goes around the U, a reversal lasts longer than that
const hairpinWatch = [];
for (let age = 4; age <= 240; age += 3) hairpinWatch.push([age, "t33/watch"]);
// t35 and t36 poll the gaps between coupled carts every 4 ticks, a squeeze lasts longer than that
const gapWatch = (last) => {
	const steps = [];
	for (let age = 4; age <= last; age += 4) steps.push([age, "bunch/watch"]);
	return steps;
};

const gametest = {
	size: [8, 2, 1],
	// Ticks added to the last step for max_ticks. Room for the arena chunks to load before a test's clock starts
	margin: 300,
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
		{ id: "t4_resume", steps: [[1, "t4/start"], [301, "t4/pop"], [346, "t4/check"]] },
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
		{ id: "t15_heading_diagonal", steps: [[1, "t15/run"]] },
		{ id: "t16_cold_start", steps: [[1, "t16/start"], [201, "t16/check"]] },
		{ id: "trace_midcurve", steps: [[1, "trace/midcurve"]] },
		{ id: "trace_crest", steps: [[1, "trace/crest"]] },
		{ id: "t17_parallel_tracks", steps: [[1, "t17/run"]] },
		{ id: "t18_reverse_yield", steps: [[1, "t18/start"], [121, "t18/reverse"], [136, "t18/check"]] },
		{ id: "t19_far_coordinates", steps: [[1, "far/prep"], [80, "far/start"], [280, "far/check"]] },
		{ id: "t20_follow_spacing", steps: [[1, "t20/start"], [101, "t20/check"]] },
		{ id: "t52_stretched_follower", steps: [[1, "t52/start"], [30, "t52/stretch"], [85, "t52/check"]] },
		{ id: "t21_sibling_followers", steps: [[1, "t21/run"]] },
		{ id: "t22_snap_velocity", steps: [[1, "t22/run"]] },
		{ id: "t23_gap_aging", steps: [[1, "t23/run"]] },
		{ id: "t24_slowed_hit", steps: [[1, "t24/run"]] },
		{ id: "t24_slowed_parallel", steps: [[1, "t24/parallel"]] },
		{ id: "t25_rail_beats_yield", steps: [[1, "t25/start"], [150, "t25/at_rail"], [151, "t25/power"], [450, "t25/check"]] },
		{ id: "t26_avoid_skips_halted", steps: [[1, "t26/run"]] },
		{ id: "t27_brake_with_followers", steps: [[1, "t27/start"], [401, "t27/check"]] },
		{ id: "t28_furnace_follower", steps: [[1, "t28/start"], [401, "t28/check"]] },
		{ id: "t29_chunk_claims", steps: [[1, "chunk/start"], [60, "chunk/claimed"], [61, "chunk/derail"], [90, "chunk/released"]] },
		{ id: "t30_break_stalled", steps: [[1, "t30/start"], [3, "t30/still"], [40, "t30/check"]] },
		{ id: "t31_blip_holds", steps: [[1, "t31/start"], [40, "t31/check"]] },
		{ id: "t32_creative_cut", steps: [[1, "t32/start"], [3, "t32/check"]] },
		{ id: "t33_hairpin_no_rebound", steps: [[1, "t33/start"], ...hairpinWatch, [250, "t33/end"]] },
		{ id: "t34_parallel_pull", steps: [[1, "t34/start"], [12, "t34/dragged"], [120, "t34/pulled"]] },
		{ id: "t35_no_bunching_stop", steps: [[1, "t35/start"], ...gapWatch(400), [401, "t35/check"]] },
		{ id: "t36_no_bunching_hairpin", steps: [[1, "t36/start"], ...gapWatch(440), [441, "t36/check"]] },
		{ id: "t43_crossed_link", steps: [[1, "t43/start"], [40, "t43/mark"], [70, "t43/check"]] },
		{ id: "t44_link_cycle", steps: [[1, "t44/run"]] },
		{ id: "t45_parallel_rails", steps: [[1, "t45/start"], [4, "t45/check"]] },
		{ id: "t46_other_level", steps: [[1, "t46/start"], [4, "t46/check"]] },
		{ id: "t47_row_stays_coupled", steps: [[1, "t47/start"], [101, "t47/check"]] },
		{ id: "t37_chunkload_off", steps: [[1, "chunk/off_start"], [60, "chunk/off_check"], [61, "chunk/on"], [90, "chunk/claimed"], [91, "chunk/off"], [120, "chunk/released"]] },
		{ id: "t59_portal_hold", steps: [[1, "t59/start"], [3, "t59/check"], [40, "t59/check"]] },
		{ id: "t60_portal_orphan", steps: [[1, "t60/start"], [55, "t60/near"], [100, "t60/check"]] },
		{ id: "t61_portal_relink", steps: [[1, "t61/start"], [4, "t61/follow"], [30, "t61/check"]] },
		{ id: "t62_leader_gone", steps: [[1, "t62/start"], [6, "t62/check"]] },
		{ id: "t56_far_leader", steps: [[1, "t56/start"], [6, "t62/check"]] },
		{ id: "t57_portal_coast", steps: [[1, "t57/start"], [8, "t57/check"]] },
		{ id: "t53_real_portal", steps: [[1, "t53/start"], [400, "t53/check"]] },
		{ id: "t54_portal_four", steps: [[1, "t54/start"], [500, "t54/check"]] },
		{ id: "t55_portal_refuel", steps: [[1, "t55/start"], [500, "t55/check"]] },
		{ id: "t58_portal_long", steps: [[1, "t58/start"], [600, "t58/check"]] },
		{ id: "t63_portal_loop", steps: [[1, "t63/start"], [600, "t63/check"]] },
		{ id: "t64_portal_loop_rider_mid", steps: [[1, "t64/start"], [600, "t64/check"]] },
		{ id: "t65_portal_loop_rider_head", steps: [[1, "t65/start"], [600, "t65/check"]] },
		{ id: "t66_portal_loop_rider_tail", steps: [[1, "t66/start"], [600, "t66/check"]] },
		{ id: "t67_slope_chain", steps: [[1, "t67/start"], [101, "t67/check"]] },
		// Last on purpose, running the load function sets the sweep grace again so nothing after this can count on a sweep. New tests go above it
		{ id: "t38_chunkload_reload", steps: [[1, "chunk/reload_unset"], [2, "chunk/reload_kept"], [3, "chunk/reload_done"]] },
	],
};

// A test's window starts when the one before it has run its last step, plus slack for its cleanup
let start = 0;
for (const t of gametest.tests) {
	t.last = Math.max(...t.steps.map(([age]) => age));
	t.start = start;
	start += t.last + 10;
}

module.exports = { gametest };
