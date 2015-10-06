/*			'buero',
			'flur',
			'elab-sued',
			'elab-nord',
			'chemie',
			'mechwerkstatt-nord',
			'mechwerkstatt-sued',
			'zgr-nord',
			'zgr-sued',
			'regie-nord',
			'regie-sued',
			'studio1',
			'datenraum',
			'studio2-sued',
			'studio2-nord',
			'studio2-arbeitsflaeche',
			'studio2-kueche',
			'studio2-spots',
			'schnittraum',
			'schnittraum-spots',
			'blinddarm'

*/

exports.static_routes = {
	'/agsbus/13/0_temp': '/ags/temperatur/aussen',
	'/agsbus/13/1_temp': '/ags/temperatur/elab',

	'/agsbus/5/3_input': '/ags/tueren/stahltuer',
	'/agsbus/2/door_state': '/ags/tueren/vordereingang',
	'/agsbus/3/door_state': '/ags/tueren/mitteleingang',
	'/agsbus/4/door_state': '/ags/tueren/hintereingang',
	
	'/agsbus/5/0_input': '/ags/sonstiges/klingeltaster',
	'/agsbus/5/1_input': '/ags/sonstiges/vordereingang-bewegung',

	'/agsbus/7/0_output': '/ags/licht/elab-sued',
	'/ags/licht/elab-sued_s': '/agsbus/7/0_output_s',
	'/agsbus/7/1_output': '/ags/licht/elab-nord',
	'/ags/licht/elab-nord_s': '/agsbus/7/1_output_s',
	'/agsbus/7/2_output': '/ags/licht/flur',
	'/ags/licht/flur_s': '/agsbus/7/2_output_s',
	'/agsbus/7/3_output': '/ags/licht/buero',
	'/ags/licht/buero_s': '/agsbus/7/3_output_s',
	'/agsbus/7/4_output': '/ags/licht/ampel_rot',
	'/ags/licht/ampel_rot_s': '/agsbus/7/4_output_s',
	'/agsbus/7/5_output': '/ags/licht/ampel_gruen',
	'/ags/licht/ampel_gruen_s': '/agsbus/7/5_output_s',

	'/agsbus/8/0_output': '/ags/licht/zgr-sued',
	'/ags/licht/zgr-sued_s': '/agsbus/8/0_output_s',
	'/agsbus/8/1_output': '/ags/licht/zgr-nord',
	'/ags/licht/zgr-nord_s': '/agsbus/8/1_output_s',

	'/agsbus/8/3_output': '/ags/licht/mechwerkstatt-sued',
	'/ags/licht/mechwerkstatt-sued_s': '/agsbus/8/3_output_s',
	'/agsbus/8/4_output': '/ags/licht/mechwerkstatt-nord',
	'/ags/licht/mechwerkstatt-nord_s': '/agsbus/8/4_output_s',
	'/agsbus/8/5_output': '/ags/licht/chemie',
	'/ags/licht/chemie_s': '/agsbus/8/5_output_s',

	'/agsbus/9/0_output': '/ags/licht/regie-nord',
	'/ags/licht/regie-nord_s': '/agsbus/9/0_output_s',
	'/agsbus/9/1_output': '/ags/licht/regie-sued',
	'/ags/licht/regie-sued_s': '/agsbus/9/1_output_s',
	'/agsbus/9/2_output': '/ags/licht/regie-monitorwand',
	'/ags/licht/regie-monitorwand_s': '/agsbus/9/2_output_s',

	'/agsbus/10/0_output': '/ags/licht/studio2-sued',
	'/ags/licht/studio2-sued_s': '/agsbus/10/0_output_s',
	'/agsbus/10/1_output': '/ags/licht/studio2-nord',
	'/ags/licht/studio2-nord_s': '/agsbus/10/1_output_s',
	'/agsbus/10/2_output': '/ags/licht/datenraum',
	'/ags/licht/datenraum_s': '/agsbus/10/2_output_s',
	'/agsbus/10/3_output': '/ags/licht/studio2-kueche',
	'/ags/licht/studio2-kueche_s': '/agsbus/10/3_output_s',
	'/agsbus/10/4_output': '/ags/licht/studio2-spots',
	'/ags/licht/studio2-spots_s': '/agsbus/10/4_output_s',
	'/agsbus/10/5_output': '/ags/licht/studio2-arbeitsflaeche',
	'/ags/licht/studio2-arbeitsflaeche_s': '/agsbus/10/5_output_s',
	
	'/agsbus/11/0_output': '/ags/licht/blinddarm',
	'/ags/licht/blinddarm_s': '/agsbus/11/0_output_s',
	'/agsbus/11/1_output': '/ags/licht/studio1',
	'/ags/licht/studio1_s': '/agsbus/11/1_output_s',
	'/agsbus/11/2_output': '/ags/licht/schnittraum-spots',
	'/ags/licht/schnittraum-spots_s': '/agsbus/11/2_output_s',
	'/agsbus/11/3_output': '/ags/licht/schnittraum',
	'/ags/licht/schnittraum_s': '/agsbus/11/3_output_s'

};

/*
/agsbus/8/0_output_s
/agsbus/8/1_output_s
/agsbus/8/2_output_s
/agsbus/8/3_output_s
/agsbus/8/4_output_s
/agsbus/8/5_output_s
/agsbus/8/6_output_s
/agsbus/8/7_output_s
/agsbus/8/0_output
/agsbus/8/1_output
/agsbus/8/2_output
/agsbus/8/3_output
/agsbus/8/4_output
/agsbus/8/5_output
/agsbus/8/6_output
/agsbus/8/7_output
/agsbus/8/0_short_push
/agsbus/8/1_short_push
/agsbus/8/2_short_push
/agsbus/8/3_short_push
/agsbus/8/4_short_push
/agsbus/8/5_short_push
/agsbus/8/6_short_push
/agsbus/8/7_short_push
/agsbus/8/0_long_push
/agsbus/8/1_long_push
/agsbus/8/2_long_push
/agsbus/8/3_long_push
/agsbus/8/4_long_push
/agsbus/8/5_long_push
/agsbus/8/6_long_push
/agsbus/8/7_long_push
/agsbus/8/0_switchtype
/agsbus/8/1_switchtype
/agsbus/8/2_switchtype
/agsbus/8/3_switchtype
/agsbus/8/4_switchtype
/agsbus/8/5_switchtype
/agsbus/8/6_switchtype
/agsbus/8/7_switchtype
/agsbus/9/0_output_s
/agsbus/9/1_output_s
/agsbus/9/2_output_s
/agsbus/9/3_output_s
/agsbus/9/4_output_s
/agsbus/9/5_output_s
/agsbus/9/6_output_s
/agsbus/9/7_output_s
/agsbus/9/0_output
/agsbus/9/1_output
/agsbus/9/2_output
/agsbus/9/3_output
/agsbus/9/4_output
/agsbus/9/5_output
/agsbus/9/6_output
/agsbus/9/7_output
/agsbus/9/0_short_push
/agsbus/9/1_short_push
/agsbus/9/2_short_push
/agsbus/9/3_short_push
/agsbus/9/4_short_push
/agsbus/9/5_short_push
/agsbus/9/6_short_push
/agsbus/9/7_short_push
/agsbus/9/0_long_push
/agsbus/9/1_long_push
/agsbus/9/2_long_push
/agsbus/9/3_long_push
/agsbus/9/4_long_push
/agsbus/9/5_long_push
/agsbus/9/6_long_push
/agsbus/9/7_long_push
/agsbus/9/0_switchtype
/agsbus/9/1_switchtype
/agsbus/9/2_switchtype
/agsbus/9/3_switchtype
/agsbus/9/4_switchtype
/agsbus/9/5_switchtype
/agsbus/9/6_switchtype
/agsbus/9/7_switchtype
/agsbus/10/0_output_s
/agsbus/10/1_output_s
/agsbus/10/2_output_s
/agsbus/10/3_output_s
/agsbus/10/4_output_s
/agsbus/10/5_output_s
/agsbus/10/6_output_s
/agsbus/10/7_output_s
/agsbus/10/0_output
/agsbus/10/1_output
/agsbus/10/2_output
/agsbus/10/3_output
/agsbus/10/4_output
/agsbus/10/5_output
/agsbus/10/6_output
/agsbus/10/7_output
/agsbus/10/0_short_push
/agsbus/10/1_short_push
/agsbus/10/2_short_push
/agsbus/10/3_short_push
/agsbus/10/4_short_push
/agsbus/10/5_short_push
/agsbus/10/6_short_push
/agsbus/10/7_short_push
/agsbus/10/0_long_push
/agsbus/10/1_long_push
/agsbus/10/2_long_push
/agsbus/10/3_long_push
/agsbus/10/4_long_push
/agsbus/10/5_long_push
/agsbus/10/6_long_push
/agsbus/10/7_long_push
/agsbus/10/0_switchtype
/agsbus/10/1_switchtype
/agsbus/10/2_switchtype
/agsbus/10/3_switchtype
/agsbus/10/4_switchtype
/agsbus/10/5_switchtype
/agsbus/10/6_switchtype
/agsbus/10/7_switchtype
/agsbus/11/0_output_s
/agsbus/11/1_output_s
/agsbus/11/2_output_s
/agsbus/11/3_output_s
/agsbus/11/4_output_s
/agsbus/11/5_output_s
/agsbus/11/6_output_s
/agsbus/11/7_output_s
/agsbus/11/0_output
/agsbus/11/1_output
/agsbus/11/2_output
/agsbus/11/3_output
/agsbus/11/4_output
/agsbus/11/5_output
/agsbus/11/6_output
/agsbus/11/7_output
/agsbus/11/0_short_push
/agsbus/11/1_short_push
/agsbus/11/2_short_push
/agsbus/11/3_short_push
/agsbus/11/4_short_push
/agsbus/11/5_short_push
/agsbus/11/6_short_push
/agsbus/11/7_short_push
/agsbus/11/0_long_push
/agsbus/11/1_long_push
/agsbus/11/2_long_push
/agsbus/11/3_long_push
/agsbus/11/4_long_push
/agsbus/11/5_long_push
/agsbus/11/6_long_push
/agsbus/11/7_long_push
/agsbus/11/0_switchtype
/agsbus/11/1_switchtype
/agsbus/11/2_switchtype
/agsbus/11/3_switchtype
/agsbus/11/4_switchtype
/agsbus/11/5_switchtype
/agsbus/11/6_switchtype
/agsbus/11/7_switchtype
/agsbus/7/1_output_s_s

*/
