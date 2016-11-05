/**
 * Created by Saskia on 02.09.2016.
 *
 * This application is used for simulation real-world devices. It generates energy- and status values for the devices
 * configured in the routers config-file and
 * To use this application you have to add following information to the routers configuration file:
 *      - the name of this application
 *      - (mandatory)The filepath of the full path to the csv file, which should be used for generating energy-data.
 *        If instead of the path an empty string is provided, this application will generate random energy-data.
 *      - (optional) The intervall of how fast the data should be generated in seconds. If no interval is supplied the
 *         standard-interval will be used (1 second).
 *      - (optional) You can add different states to a device and a energy-threashold  when the state occurs. To add
 *         a state, you have to add an state-object to the states-key which consists of the energy-threasholds as key
 *         and the names of a state. Example: {"100":"On"} -> When the energy-value is >100 the device is "On".
 *
 * EXAMPLE config-entry:
 *
 * "name": "er-app-virtual_device_generator",
 * "config": {
 *      "Geschirrspüler": {
 *              "filepath": "C:/USers/Saskia/Dropbox/Masterarbeit/energy-router/csv_data/Küche.csv",
 *              "interval": 2
 *              },
 *      "Kaffeevollautomat": {
 *              "filepath:": "C:/USers/Saskia/Dropbox/Masterarbeit/energy-router/csv_data/Küche.csv"
 *              "interval": 3,
 *              "states": {"100": "On", "1000":"Full_power"}
 *              },
 *      "Wasserkocher": {
 *              "filepath": "C:/USers/Saskia/Dropbox/Masterarbeit/energy-router/csv_data/Küche.csv"
 *              },
 *      "Testgerät": {
 *              "filepath": ""
 *              }
 */

exports.init = function(app, app_config, router_config, autoinstall) {

    var r = router_config.router;
    require('./module_history.js').init(r, 'ram');
    require('./router_device_virtual.js').init(r);
    r.eventdetection = require('./router_io_eventdetection.js').init.bind(r, r);

    for(device in app_config){

        var state_node= "/app/er-app-virtual_device_generator/"+device+".status";
        var energy_node = "/app/er-app-virtual_device_generator/"+device+".energy";

        try {
            //create an energy-node for the device and start publishing energy-data
            r.node(energy_node).announce();
            if (app_config[device].filepath === "") {
                require('./router_random_in.js').init(r, energy_node,
                    (app_config[device].interval*1000 || 1000));
            } else {
                r.play_device(energy_node ,{
                    "filename": app_config[device].filepath,
                    "interval": (app_config[device].interval || 1),
                });
            }
            //add a state-node for the device (if "states" in config) which changes state on the defined event
            if (typeof app_config[device].states !== 'undefined'){
                //r.node(state_node).announce();
                r.eventdetection( r.node(energy_node), state_node, app_config[device].states);
            }

        }catch(error){
            throw error;
        }
    }
}