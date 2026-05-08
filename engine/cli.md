# CLI
`cli` is the command-line runtime module of Softadastra Engine.It provides reusable building blocks for parsing commands, registering handlers, running interactive sessions, formatting output, and building terminal tools.The core rule is:```txtCLI exposes engine behavior.CLI does not own engine behavior.
The CLI is an interface layer.
It should call engine modules, not become the engine itself.
Why CLI exists
Softadastra needs a terminal interface for development, debugging, local runtime inspection, and automation.
A CLI makes it possible to inspect and control a local Softadastra node from the terminal.
Useful CLI workflows include:
show runtime statusshow node informationwrite local valuesread local valuesinspect sync staterun sync tickslist peersstart or inspect local servicesdebug local-first behavior
The CLI module provides the reusable primitives needed to build those commands.
What CLI provides
The cli module provides:
TokenizerCommandLineArgParserParsedCommandCliCommandCommandRegistryICommandHandlerCliConfigCliContextCliEngineCliServiceCliOptionsTableFormatterUI style helpers
It allows the engine to:
parse terminal inputparse argumentsparse optionsregister commandsexecute handlerssupport aliasesrun single commandsrun interactive modeformat tablesprint clean terminal output
What CLI does not do
cli must not:
own store internalsown sync internalsown transport internalsown discovery internalsown metadata internalshide engine errorsmake lower modules depend on CLIcontain business logic that belongs in modules
The rule is:
CLI parses input.CLI dispatches commands.Engine modules perform runtime behavior.CLI formats output.
Include
Use the top-level include:
#include <softadastra/cli/cli.hpp>
Module location
The module lives in:
modules/cli/
Typical structure:
modules/cli/├── include/│   └── softadastra/cli/│       ├── command/│       ├── core/│       ├── engine/│       ├── parser/│       ├── types/│       ├── utils/│       └── cli.hpp├── src/├── examples/├── tests/├── README.md├── CMakeLists.txt└── CHANGELOG.md
The exact structure can evolve, but the responsibility should stay stable:
turn terminal input into engine actions
Main concepts
The CLI module is built around these concepts:
TokenizerArgParserCommandRegistryCommandHandlerCliEngineCliServiceFormatter
The normal command flow is:
terminal input  ↓Tokenizer  ↓CommandLine  ↓ArgParser  ↓ParsedCommand  ↓CommandRegistry  ↓ICommandHandler  ↓engine module call  ↓formatted output
Tokenizer
Tokenizer splits raw command input into tokens.
Example input:
store-put name "Softadastra Runtime" --durable true --port=8080
Tokens:
store-putnameSoftadastra Runtime--durabletrue--port=8080
The tokenizer must handle:
plain wordsquoted stringsoptionsflagsnumbersspaces
Tokenizer example
#include <iostream>#include <softadastra/cli/cli.hpp>int main(){    const std::string input =        R"(store-put name "Softadastra Runtime" --durable true --port=8080)";    const auto tokens =        softadastra::cli::parser::Tokenizer::tokenize(input);    std::cout << "Input:\n";    std::cout << "  " << input << "\n\n";    std::cout << "Tokens:\n";    for (std::size_t i = 0; i < tokens.size(); ++i)    {        std::cout << "  ["                  << i                  << "] "                  << tokens[i]                  << "\n";    }    return 0;}
CommandLine
CommandLine wraps tokenized input.
It gives the parser a structured view of the command.
Conceptual flow:
raw input  ↓tokens  ↓CommandLine  ↓ArgParser
The command line should remain a lightweight representation of parsed terminal input.
ArgParser
ArgParser converts tokens into a structured command.
It extracts:
command namepositional argumentsoptionsflagstyped option values
Example input:
deploy app --host=localhost --port 8080 --verbose --ratio=0.75
Parsed command:
name = deployargs = [app]options:  host = localhost  port = 8080  verbose = true  ratio = 0.75
Option values
CLI options can hold different value types.
Supported conceptual types:
emptyboolintegerdoublestring
This makes CLI parsing more useful than raw string maps.
Arg parser example
#include <iostream>#include <string>#include <softadastra/cli/cli.hpp>namespace cli_parser = softadastra::cli::parser;namespace cli_types = softadastra::cli::types;namespace{    std::string value_to_string(const cli_types::OptionValue &value)    {        if (std::holds_alternative<std::monostate>(value))        {            return "<empty>";        }        if (std::holds_alternative<bool>(value))        {            return std::get<bool>(value) ? "true" : "false";        }        if (std::holds_alternative<std::int64_t>(value))        {            return std::to_string(std::get<std::int64_t>(value));        }        if (std::holds_alternative<double>(value))        {            return std::to_string(std::get<double>(value));        }        if (std::holds_alternative<std::string>(value))        {            return std::get<std::string>(value);        }        return "<unknown>";    }}int main(){    const std::string input =        R"(deploy app --host=localhost --port 8080 --verbose --ratio=0.75)";    const auto tokens = cli_parser::Tokenizer::tokenize(input);    const cli_parser::CommandLine line{tokens};    const auto parsed = cli_parser::ArgParser::parse(line);    std::cout << "Command: "              << parsed.name              << "\n\n";    std::cout << "Arguments:\n";    for (const auto &arg : parsed.args)    {        std::cout << "  - "                  << arg                  << "\n";    }    std::cout << "\nOptions:\n";    for (const auto &[key, value] : parsed.options)    {        std::cout << "  "                  << key                  << " = "                  << value_to_string(value)                  << " ("                  << cli_types::option_value_type(value)                  << ")\n";    }    return 0;}
ParsedCommand
ParsedCommand is the structured result of parsing.
It contains:
nameargsoptions
A handler receives a ParsedCommand.
Example:
cli_types::CliErrorCode handle(    const cli_parser::ParsedCommand &command) override
Handlers should not parse raw terminal strings again.
They should use the parsed command structure.
CliCommand
CliCommand describes a registered command.
It can contain:
namedescriptionusagecommand typealiasesoptions metadata, if supported
Example:
cli_command::CliCommand{    "status",    "Show Softadastra runtime status",    "status",    cli_types::CliCommandType::Info,    {"st"},    {},}
A command definition tells the CLI how the command should appear and how it can be invoked.
Command aliases
Aliases allow short names.
Example:
status -> stping   -> phello  -> hi
Aliases make interactive CLI usage faster.
They should remain clear and predictable.
Command types
Command types help classify commands.
Possible categories:
InfoDiagnosticAdminSystemCustom
The exact enum values depend on the current implementation.
Command types are useful for help output and organization.
ICommandHandler
ICommandHandler is the interface for command behavior.
A handler receives a parsed command and returns a CLI error code.
Conceptual shape:
class ICommandHandler{public:    virtual CliErrorCode handle(const ParsedCommand &command) = 0;};
Handlers are where command-specific behavior happens.
CommandRegistry
CommandRegistry stores command definitions and their handlers.
It can:
register commandscheck whether a command existsresolve aliasesreturn handlerscount commands
The registry is the bridge between parsed command names and executable behavior.
Command registry example
#include <iostream>#include <memory>#include <softadastra/cli/cli.hpp>namespace cli_command = softadastra::cli::command;namespace cli_parser = softadastra::cli::parser;namespace cli_types = softadastra::cli::types;namespace{    class PingHandler final : public cli_command::ICommandHandler    {    public:        [[nodiscard]] cli_types::CliErrorCode handle(            const cli_parser::ParsedCommand &) override        {            std::cout << "pong\n";            return cli_types::CliErrorCode::None;        }    };}int main(){    cli_command::CommandRegistry registry;    cli_command::CliCommand command{        "ping",        "Check that the CLI registry works",        "ping",        cli_types::CliCommandType::Diagnostic,        {"p"},        {},    };    registry.register_command(        command,        std::make_shared<PingHandler>());    std::cout << "Registry size: "              << registry.size()              << "\n";    std::cout << "exists ping: "              << (registry.exists("ping") ? "yes" : "no")              << "\n";    std::cout << "exists p: "              << (registry.exists("p") ? "yes" : "no")              << "\n";    const auto handler = registry.get_handler("p");    if (handler != nullptr)    {        cli_parser::ParsedCommand parsed;        parsed.name = "p";        return static_cast<int>(handler->handle(parsed));    }    return 1;}
CliConfig
CliConfig configures the CLI runtime.
It can define:
app nameversioninteractive modebanner visibilityprompt behavior, if supported
Example:
cli_core::CliConfig config;config.app_name = "softadastra";config.version = "0.1.0";config.interactive = false;config.show_banner = false;
The config should make runtime behavior explicit.
CliContext
CliContext wires the CLI engine to runtime data.
It can hold:
configcommand registryengine services, when neededruntime pointers, when needed
Example:
cli_core::CliContext context;context.config = &config;context.registry = &registry;
The context is passed to the CLI engine.
CliEngine
CliEngine runs parsed commands through the registry and handlers.
It can:
startexecute command stringsstoprun command handlersmanage interactive state
Conceptual flow:
CliEngine::execute("status")  ↓tokenize  ↓parse  ↓resolve handler  ↓run handler  ↓return CliErrorCode
CliEngine example
#include <iostream>#include <memory>#include <softadastra/cli/cli.hpp>#include <softadastra/cli/command/CliCommand.hpp>#include <softadastra/cli/command/ICommandHandler.hpp>#include <softadastra/cli/core/CliConfig.hpp>#include <softadastra/cli/core/CliContext.hpp>#include <softadastra/cli/engine/CliEngine.hpp>namespace{    namespace cli_command = softadastra::cli::command;    namespace cli_core = softadastra::cli::core;    namespace cli_engine = softadastra::cli::engine;    namespace cli_parser = softadastra::cli::parser;    namespace cli_types = softadastra::cli::types;    class HelloCommandHandler : public cli_command::ICommandHandler    {    public:        cli_types::CliErrorCode handle(            const cli_parser::ParsedCommand &command) override        {            std::cout << "Hello from custom command";            if (!command.args.empty())            {                std::cout << ", "                          << command.args.front();            }            std::cout << "!\n";            return cli_types::CliErrorCode::None;        }    };    class SumCommandHandler : public cli_command::ICommandHandler    {    public:        cli_types::CliErrorCode handle(            const cli_parser::ParsedCommand &command) override        {            if (command.args.size() < 2)            {                std::cerr << "sum requires at least 2 integer arguments\n";                return cli_types::CliErrorCode::InvalidArguments;            }            long long total = 0;            for (const auto &arg : command.args)            {                try                {                    total += std::stoll(arg);                }                catch (...)                {                    std::cerr << "invalid integer: "                              << arg                              << "\n";                    return cli_types::CliErrorCode::InvalidArguments;                }            }            std::cout << "sum = "                      << total                      << "\n";            return cli_types::CliErrorCode::None;        }    };    void register_custom_commands(        cli_command::CommandRegistry &registry)    {        registry.register_command(            cli_command::CliCommand{                "hello",                "Print a greeting message",                "hello [name]",                cli_types::CliCommandType::Custom,                {"hi"}},            std::make_shared<HelloCommandHandler>());        registry.register_command(            cli_command::CliCommand{                "sum",                "Sum integer arguments",                "sum <a> <b> [c] ...",                cli_types::CliCommandType::Custom,                {}},            std::make_shared<SumCommandHandler>());    }}int main(){    cli_core::CliConfig config;    config.app_name = "softadastra-cli-demo";    config.version = "0.1.0";    config.interactive = false;    config.show_banner = false;    cli_command::CommandRegistry registry;    register_custom_commands(registry);    cli_core::CliContext context;    context.config = &config;    context.registry = &registry;    cli_engine::CliEngine engine(context);    if (!engine.start())    {        std::cerr << "failed to start CLI engine\n";        return 1;    }    std::cout << "Running demo commands...\n";    auto result = engine.execute("hello");    if (result != cli_types::CliErrorCode::None)    {        std::cerr << "hello command failed\n";        return 1;    }    result = engine.execute("hello Gaspard");    if (result != cli_types::CliErrorCode::None)    {        std::cerr << "hello Gaspard command failed\n";        return 1;    }    result = engine.execute("sum 10 20 30");    if (result != cli_types::CliErrorCode::None)    {        std::cerr << "sum command failed\n";        return 1;    }    engine.stop();    return 0;}
CliService
CliService is a higher-level wrapper around CLI runtime behavior.
It is useful when you want a simpler API for registering commands and running the CLI.
Example:
softadastra::cli::CliService service{config};
Then:
service.register_command(...);service.run(...);
Single-command service example
#include <softadastra/cli/cli.hpp>int main(){    softadastra::cli::core::CliConfig config;    config.app_name = "softadastra";    config.version = "0.1.0";    config.interactive = false;    config.show_banner = false;    softadastra::cli::CliService service{config};    return service.run(        softadastra::cli::CliOptions::single_command("help"));}
Custom command service example
#include <iostream>#include <memory>#include <softadastra/cli/cli.hpp>namespace cli_command = softadastra::cli::command;namespace cli_core = softadastra::cli::core;namespace cli_parser = softadastra::cli::parser;namespace cli_types = softadastra::cli::types;namespace{    class StatusHandler final : public cli_command::ICommandHandler    {    public:        [[nodiscard]] cli_types::CliErrorCode handle(            const cli_parser::ParsedCommand &command) override        {            std::cout << "Softadastra status\n";            std::cout << "  command: "                      << command.name                      << "\n";            std::cout << "  state: healthy\n";            return cli_types::CliErrorCode::None;        }    };}int main(){    cli_core::CliConfig config;    config.app_name = "softadastra";    config.version = "0.1.0";    config.interactive = false;    config.show_banner = false;    softadastra::cli::CliService service{config};    service.register_command(        cli_command::CliCommand{            "status",            "Show Softadastra runtime status",            "status",            cli_types::CliCommandType::Info,            {"st"},            {},        },        std::make_shared<StatusHandler>());    return service.run(        softadastra::cli::CliOptions::single_command("status"));}
Interactive mode
Interactive mode keeps the CLI running and accepts commands repeatedly.
Flow:
start CLI  ↓show banner, if enabled  ↓read line  ↓parse command  ↓execute handler  ↓print result  ↓read next line
It stops on commands such as:
exitquit
depending on the current command set.
Minimal interactive example
#include <softadastra/cli/cli.hpp>int main(){    softadastra::cli::core::CliConfig config;    config.app_name = "softadastra-cli";    config.version = "0.1.0";    config.interactive = true;    config.show_banner = true;    softadastra::cli::CliService cli(config);    softadastra::cli::CliOptions options;    options.interactive = true;    return cli.run(options);}
Single-command mode
Single-command mode runs one command and exits.
Flow:
start CLI  ↓parse command  ↓execute command  ↓print output  ↓return exit code
This mode is useful for scripts and automation.
Example:
softadastra statussoftadastra store get app/namesoftadastra sync tick
TableFormatter
TableFormatter formats tabular output.
This is useful for:
command listpeer liststore entriessync statemetadata capabilitiesruntime status
Table formatter example
#include <iostream>#include <string>#include <vector>#include <softadastra/cli/cli.hpp>int main(){    const std::vector<std::string> headers{        "Command",        "Type",        "Description",    };    const std::vector<std::vector<std::string>> rows{        {"help", "info", "Show help information"},        {"version", "info", "Show CLI version"},        {"exit", "system", "Exit the CLI session"},        {"node-start", "admin", "Start a Softadastra node"},    };    std::cout << softadastra::cli::utils::TableFormatter::format(        headers,        rows);    return 0;}
UI style helpers
The CLI module can provide helpers for consistent terminal output.
Examples:
sectionok_lineinfo_linewarn_lineerr_linespacerkvbolddimlink
These helpers keep CLI output readable and consistent.
UI style example
#include <iostream>#include <softadastra/cli/cli.hpp>int main(){    namespace ui = softadastra::cli::utils::ui;    namespace style = softadastra::cli::utils::style;    ui::section(std::cout, "Softadastra CLI");    ui::ok_line(std::cout, "Runtime initialized");    ui::info_line(std::cout, "Loading command registry");    ui::warn_line(std::cout, "Experimental command enabled");    ui::err_line(std::cout, "Example error output");    ui::spacer(std::cout);    ui::kv(std::cout, "app", "softadastra");    ui::kv(std::cout, "version", "0.1.0");    ui::kv(std::cout, "mode", "production");    ui::spacer(std::cout);    std::cout << style::bold("Strong text") << "\n";    std::cout << style::dim("Muted text") << "\n";    std::cout << style::link("https://github.com/softadastra/softadastra") << "\n";    return 0;}
CLI error codes
CLI handlers return CliErrorCode.
Common conceptual codes:
NoneInvalidArgumentsUnknownCommandExecutionFailedInternalError
The exact enum values depend on the implementation.
The important rule is:
command handlers should return clear status codes
This lets the CLI produce proper exit codes.
Error handling
CLI errors should be clear.
Bad:
failed
Good:
unknown command: sync-now
Good:
sum requires at least 2 integer arguments
Good:
invalid integer: abc
CLI errors should help the user fix the command.
Unknown command
If a command is unknown:
input command  ↓registry lookup fails  ↓return UnknownCommand  ↓print helpful message
The CLI can suggest help when possible.
Invalid arguments
If arguments are missing or invalid:
handler validates args  ↓argument invalid  ↓return InvalidArguments  ↓print usage
Example:
sum requires at least 2 integer argumentsusage: sum <a> <b> [c] ...
Command handler design
A command handler should:
validate argumentscall engine modulehandle module resultprint useful outputreturn CliErrorCode
A command handler should not:
parse raw input againown unrelated module statehide module errorsperform too many unrelated actions
Good handler flow
ParsedCommand  ↓validate args  ↓call module  ↓check result  ↓format output  ↓return status
Store command flow
A store command should call the store module.
Example conceptual flow:
store put user:1 Gaspard  ↓parse command  ↓validate key and value  ↓StoreEngine::put  ↓print result
The store module owns the write.
The CLI owns the command and output.
Sync command flow
A sync command should call the sync module.
Example:
sync tick  ↓parse command  ↓SyncScheduler::tick  ↓print batch size, retried count, pruned count
The sync module owns the tick.
The CLI owns the terminal presentation.
Node command flow
A node command can call metadata and runtime services.
Example:
node info  ↓refresh metadata  ↓print node id, hostname, OS, version, capabilities
The metadata module owns node identity.
The CLI formats it.
Peers command flow
A peers command can call discovery and transport.
Example:
peers  ↓read discovery registry  ↓read transport peer registry  ↓print known peers
Discovery owns peer discovery.
Transport owns connection state.
The CLI owns the display.
Status command flow
A status command can aggregate runtime state.
Example:
status  ↓read node metadata  ↓read store size  ↓read sync state  ↓read transport status  ↓read discovery status  ↓print summary
Status should be useful for debugging.
CLI and core
CLI can use core-style explicit error handling patterns.
But core must not depend on CLI.
Correct direction:
cli -> core
Wrong direction:
core -> cli
CLI and store
CLI can expose store commands.
Correct direction:
cli command  ↓StoreEngine
Wrong direction:
StoreEngine  ↓CLI output
Store returns data.
CLI formats output.
CLI and sync
CLI can expose sync commands.
Correct direction:
cli command  ↓SyncEngine
Sync should not print CLI output directly.
CLI and transport
CLI can expose transport and peer status.
Correct direction:
cli command  ↓TransportEngine
Transport should not depend on CLI formatting.
CLI and discovery
CLI can expose discovered peers.
Correct direction:
cli command  ↓DiscoveryService
Discovery should return structured peer data.
CLI should format it.
CLI and metadata
CLI can expose node metadata.
Correct direction:
cli command  ↓MetadataService
Metadata should return data.
CLI should format output.
CLI and SDK
The CLI and SDK are both user-facing layers.
They should sit above the engine modules.
Engine modules  ↓CLI
Engine modules  ↓SDK
The CLI is for terminal users.
The SDK is for application developers.
They should share engine behavior rather than duplicate it.
CLI and apps
The apps/cli executable should compose engine modules and CLI commands.
The modules/cli module should provide reusable CLI infrastructure.
The separation is:
modules/cli  -> parser, registry, engine, service, formattersapps/cli  -> actual Softadastra command-line app
This keeps reusable CLI tools separate from product-specific commands.
App-specific commands
Commands such as these belong in the CLI app or command layer:
statusnodestoresyncpeers
Reusable parsing and formatting belongs in modules/cli.
CLI examples
Current useful examples include:
cli_tokenizer.cppcli_arg_parser.cppcli_registry.cppcli_custom_command.cppcli_commands_demo.cppcli_service_single.cppcli_minimal.cppcli_table_formatter.cppcli_ui_style.cpp
Recommended order:
1. cli_tokenizer.cpp2. cli_arg_parser.cpp3. cli_registry.cpp4. cli_custom_command.cpp5. cli_commands_demo.cpp6. cli_service_single.cpp7. cli_minimal.cpp8. cli_table_formatter.cpp9. cli_ui_style.cpp
This order moves from parsing to command execution and output formatting.
Run examples
From the engine repository:
cd ~/softadastra/softadastra
Build:
vix build
Or with CMake:
cmake --preset dev-ninjacmake --build --preset build-ninja
Find binaries:
find build-ninja -type f -executable
Run the relevant CLI example binary from the build output.
Testing CLI
CLI tests should verify:
tokenizer basic wordstokenizer quoted stringstokenizer optionsarg parser command namearg parser positional argsarg parser bool flagsarg parser integer valuesarg parser double valuesarg parser string valuescommand registry insertcommand registry alias resolutionunknown command behaviorhandler executioninvalid argument behaviorsingle-command modeinteractive command executiontable formatter output
Good CLI test flow
Tokenizer test:
input: store-put name "Softadastra Runtime"expect tokens:  store-put  name  Softadastra Runtime
Parser test:
input: deploy app --host=localhost --port 8080 --verboseexpect:  name = deploy  args = [app]  host = localhost  port = 8080  verbose = true
Registry test:
register ping with alias pexpect exists("ping")expect exists("p")expect handler for "p"
Handler test:
execute custom commandexpect CliErrorCode::Noneexpect expected output
Formatter test:
format table headers and rowsexpect readable table output
CLI design rules
The cli module should follow these rules:
1. Parse input clearly.2. Keep handlers small.3. Keep output readable.4. Do not hide engine errors.5. Do not make engine modules depend on CLI.6. Keep reusable CLI infrastructure in modules/cli.7. Keep app-specific commands in apps/cli or command layer.8. Support single-command and interactive usage.9. Return clear error codes.10. Keep examples small and focused.
Common mistakes
Making modules depend on CLI
Wrong:
StoreEngine prints CLI table
Better:
StoreEngine returns entriesCLI formats table
Parsing raw strings inside handlers
Wrong:
handler receives ParsedCommandhandler reparses original input string
Better:
handler uses command.args and command.options
Hiding engine errors
Wrong:
StoreEngine::put failedCLI prints "failed"
Better:
CLI prints the module error message with context
Example:
store put failed: invalid key
Putting product behavior in parser
Wrong:
ArgParser knows about store put behavior
Better:
ArgParser parses generic commandsStore command handler validates store-specific behavior
Making every command huge
A command handler should do one job.
If it grows too large, split logic into smaller services.
Ignoring aliases
If commands expose aliases, test them.
Inconsistent output
Use table and UI helpers to keep output consistent.
Recommended usage pattern
Create CLI config:
cli_core::CliConfig config;config.app_name = "softadastra";config.version = "0.1.0";config.interactive = false;config.show_banner = false;
Create service:
softadastra::cli::CliService service{config};
Create handler:
class StatusHandler final : public cli_command::ICommandHandler{public:    [[nodiscard]] cli_types::CliErrorCode handle(        const cli_parser::ParsedCommand &command) override    {        std::cout << "status: ok\n";        return cli_types::CliErrorCode::None;    }};
Register command:
service.register_command(    cli_command::CliCommand{        "status",        "Show runtime status",        "status",        cli_types::CliCommandType::Info,        {"st"},        {},    },    std::make_shared<StatusHandler>());
Run command:
return service.run(    softadastra::cli::CliOptions::single_command("status"));
API reference
Main areas:
AreaPurposeparserTokenizer, CommandLine, ArgParser, ParsedCommandcommandCliCommand, CommandRegistry, ICommandHandlercoreCliConfig, CliContextengineCliEnginetypesCliErrorCode, CliCommandType, OptionValueutilsTableFormatter, UI helpers, style helpers
Main types
TypePurposeTokenizerSplits command input into tokensCommandLineRepresents tokenized command inputArgParserProduces a ParsedCommandParsedCommandStructured command dataCliCommandCommand metadataCommandRegistryCommand and handler registryICommandHandlerCommand handler interfaceCliConfigCLI runtime configurationCliContextCLI runtime contextCliEngineExecutes commandsCliServiceHigher-level CLI wrapperCliOptionsRun optionsTableFormatterFormats tables
Common methods
MethodPurposeTokenizer::tokenize(input)Split input into tokensArgParser::parse(line)Parse command lineregistry.register_command(...)Register command and handlerregistry.exists(name)Check command or aliasregistry.get_handler(name)Get command handlerengine.start()Start CLI engineengine.execute(input)Execute command inputengine.stop()Stop CLI engineservice.register_command(...)Register command through serviceservice.run(options)Run CLI serviceTableFormatter::format(headers, rows)Format table output
Only document a method as stable when it exists in the current public API.
Summary
cli is the command-line runtime module of Softadastra Engine.
It provides:
TokenizerArgParserCommandRegistryICommandHandlerCliConfigCliContextCliEngineCliServiceTableFormatterUI helpers
The key idea is:
CLI turns terminal input into clear engine actions.
It does not own store, sync, transport, discovery, or metadata behavior.
Next step
Continue with guides:
Go to Guides
