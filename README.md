# Operating System for Internet of Things Applications (osiota)

*osiota* is a software platform capable of running *distributed IoT applications* written in JavaScript to enable any kind of IoT tasks.

Its fields of operational include:

  * Smart Home
  * Building Automation
  * Energy Management
  * Smart Industrial Applications
  * TV Studio Automation
  * Fancy Communication Tasks

Of cause, any "normal" not distributed task can be realized as well.

<!-- TODO: Add link to a demo here? -->

## Why?

The Internet of Things (IoT) consists of **things** as well as **applications**.<br>
**Applications**

* define the tasks and activities of things,
* interconnect things, and
* get humans involved.

But where should these IoT applications live? In the Internet of Things, of course, and not (only) in the cloud.
Therefore an operating system (not as for PCs) is needed to run these distributed IoT applications and connect them with the **things**.

*osiota* is our solution. It is a software platform capable of running software modules. Multiple of these modules can form a distributed IoT application. *osiota* can be run on any device that is able to run Node.js or JavaScript code, as far as we know.

By connecting multiple running processes of *osiota*, connected items and applications can be shared between hosts. As smartphones, tablets and personal computer are important devices to communicate with the users, *osiota* can be executed on these devices as well and provide IoT applications with graphical user interfaces (GUI). A cloud service can be included too, but this service is just seen as another device.

## Distinguishing features / Pros

osiota

  * provides simple APIs
  * can be used to ensure data security and data protection<!--TODO-->
  * uses one programming language for all devices and software layers: JavaScript

<!--TODO performance-->

## IoT Applications (osiota-app-)

An *IoT application* can run across multiple hosts. Therefore it can consist of multiple software parts running on different hosts, together forming the IoT application.

*osiota* can start JavaScript files or repositories starting with the string `osiota-app-`. It uses

  * the [osiota Application API](doc/api-application.md) as well as
  * the [osiota Node API](doc/api-node.md)

for communication with the other parts of the IoT application.

### Types of Applications

  * Data Acquisition from Sensors, Devices, ...
  * Device Control
  * Measuring and Control Techniques
  * Digital Signal Processing
  * User Interfaces
  * Dashboards
  * and many more

### Applications for osiota

See on [NPM with search term osiota](https://www.npmjs.com/search?q=osiota). Official osiota apps are situated in the [GitHub group osiota](https://github.com/osiota/]).

Examples (TODO):

## Further Guides

  * Installation and configuration guide
  * Build you own application
  * API definitions

## Demonstrators

  * Chat / Drag / ... Application
  * [ags Lebkuchenhaus (Gingerbread house)](https://www.ags.tu-bs.de/?id=lebkuchenhaus) – offline
  * Smart Home Virtual Environment
  * Video-Box
  * DMX Light Project

## Publications

  1. [Simon Walz and Yannic Schröder, “A privacy-preserving system architecture for applications raising the energy efficiency,” in 2016 IEEE 6th International Conference on Consumer Electronics - Berlin (ICCE-Berlin), 2016, pp. 62–66.](dx.doi.org/10.1109/ICCE-Berlin.2016.7684718)
  2. [Simon Walz, “Energie sparen mit Hilfe des Internet der Dinge (IoT),” Fachzeitschrift für Fernsehen, Film und Elektron. Medien, vol. 8–9, pp. 366–370, 2016.](https://www.fkt-online.de/archiv/artikel/2016/fkt-8-2016/15144-energie-sparen-mit-hilfe-des-internet-der-dinge-iot/)
  3. [Simon Walz, “Eine Softwareplattform zur Realisierung von verteilten Smart-Energy-Anwendungen im IoT,” in VDE-Kongress 2016 - Internet der Dinge, 2016, pp. 1–5. ICCE und VDE Veröffentlichungen](https://www.vde-verlag.de/proceedings-de/454308071.html)
<!--  4. [Simon Walz, “Ein System zur Gerätevernetzung für das Energiemanagement”, Dissertation von der Fakultät für Elektrotechnik, Informationstechnik, Physik der Technischen Universität Braunschweig, 2019]()-->


## Thanks to

*osiota* has been mainly developed at the [Institut für Nachrichtentechnik](https://www.tu-braunschweig.de/ifn/) of the [Technische Universität Braunschweig](https://www.tu-braunschweig.de/) in cooperation with the [Institut für Betriebssysteme und Rechnerverbund](https://www.ibr.cs.tu-bs.de/).


Its primary Author is [Simon Walz](https://simonwalz.de/) ([Github](https://github.com/simonwalz/)).

## License

This software is released under the MIT license.

Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms.
