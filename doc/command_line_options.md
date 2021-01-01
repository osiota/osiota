# Command line options

Usage: `osiota [args]`

 <table>
  <thead>
  <tr>
    <th>Option</th>
    <th>Description</th>
  </tr>
  </thead>
  <tbody>
  <tr>
    <td><code>--config [file]</code></td>
    <td>Path to the config file (default: "osiota.json")</td>
  </tr>
  <tr>
    <td><code>--status</code>, <code>-s</code></td>
    <td>Get status of the daemon</td>
  </tr>
  <tr>
    <td><code>--daemon</code>, <code>-d</code></td>
    <td>Daemonize the process</td>
  </tr>
  <tr>
    <td><code>--restart</code></td>
    <td>Restart process</td>
  </tr>
  <tr>
    <td><code>--reload</code>, <code>-r</code></td>
    <td>Reload the configuration of a daemon</td>
  </tr>
  <tr>
    <td><code>--stop</code>, <code>-k</code></td>
    <td>Stop a daemon</td>
  </tr>
  <tr>
    <td><code>--app [app]</code></td>
    <td>Run CLI-function of an app. Don't load the configuration.</td>
  </tr>
  <tr>
    <td><code>--help</code>, <code>-h</code></td>
    <td>Show help text</td>
  </tr>
  <tr>
    <td><code>--app [app] --help</code></td>
    <td>Show help text for an app</td>
  </tr>
  <tr>
    <td><code>--version</code>, <code>-V</code></td>
    <td>Show version</td>
  </tr>
  <tr>
    <td><code>--verbose</code>, <code>--no-verbose</code>, <code>-v</code></td>
    <td>Show more or less messages</td>
  </tr>
 </table>

## Example:

Start osiota as a daemon:

```sh
osiota --config myconfig.json --daemon
```

