## Composition of one energy-router
Each energy-router (ER) consists of a central core which starts apps for further functionality and handles the communication with other ERs over a web-socket connection. The apps implement additions to the functionality of an ER, those additions are e.g. hardware bindings to sensors and actuators or data processing algorithms.

ERs handle data in so called nodes. Those nodes can be generated at startup or during the runtime and each represent one data-stream enhanced by meta-data. For example one node could be the energy-consumption of a fridge, then they carried data would be the current energy usage and the meta-data could contain information about the unit of the energy consumption or further specifications of the fridge. Often energy-consumption is measured once a second, in this case the ER would publish the measurement every second to the corresponding node. Other ERs or nodes who are interested in the data of the fridge can subscribe to the node and will be informed about every new published value.
One way to visualize these node-based data streams is the use of the web interface.

The structure of an ER how private data is protected can be seen in the following figure:
![The structure of an ER](privacy.png "internal structure")


