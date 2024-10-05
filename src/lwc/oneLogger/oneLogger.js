import createTransactionId from '@salesforce/apex/ok.LightningLogger.createTransactionId';
import apexLog from '@salesforce/apex/ok.LightningLogger.log';

const VERSION = '0.1-beta';

class Transaction {
    async getId() {
        try {
            return createTransactionId();
        } catch (e) {
            console.error(e);
            // fallback id
            this.id = `lightning-${new Date().toISOString()}`;
        }
        return this.id;
    }
}

class LightningLogger {
    constructor({ component, name, namespace }) {
        this.component = component;
        this.name = name;
        this.namespace = namespace;
    }

    error() {
        return this.createLog('ERROR');
    }

    warn() {
        return this.createLog('WARN');
    }

    info() {
        return this.createLog('INFO');
    }

    debug() {
        return this.createLog('DEBUG');
    }

    fine() {
        return this.createLog('FINE');
    }

    finer() {
        return this.createLog('FINER');
    }

    finest() {
        return this.createLog('FINEST');
    }

    createLog(logLevel) {
        return new Log({
            logLevel,
            component: this.component,
            name: this.name,
            namespace: this.namespace
        });
    }
}

class Log {
    constructor({ logLevel, component, name, namespace, transaction }) {
        this.logLevel = logLevel;
        this.component = component;
        this.name = name;
        this.namespace = namespace;
        this.transaction = transaction || globalTransaction;
    }

    addError(e) {}

    async log(message) {
        const url = new URL(window.location.href);
        const componentName = this.component?.template?.host?.localName;
        const name = componentName || this.name;
        const data = {
            name,
            logLevel: this.logLevel,
            message,
            namespace: this.namespace,
            transactionId: await this.transaction.getId(),
            version: VERSION,
            web: {
                location: {
                    ...JSON.parse(JSON.stringify(window.location)),
                    searchParams: getSearchParamsAsObject(url)
                }
            }
        };
        const log = await apexLog({
            data: JSON.stringify(data)
        });
        if (log.isWebConsoleDebugEnabled) {
            getConsoleLogFunction(this.logLevel)(log.webConsoleLog);
        }
    }
}

const getSearchParamsAsObject = (url) =>
    [...url.searchParams.entries()].reduce(
        (params, [key, value]) => ({
            ...params,
            [key]: value
        }),
        {}
    );

const getConsoleLogFunction = () => {
    switch (this.logLevel) {
        case 'ERROR':
            return console.error;
        case 'WARN':
            return console.warn;
        case 'DEBUG':
            return console.debug;
    }
    return console.log;
};

const getLogger = (opts) => new LightningLogger(opts);
const getTransaction = () => globalTransaction;
const newTransaction = () => new Transaction();

const globalTransaction = newTransaction();

export default getLogger;

export { getLogger, getTransaction, newTransaction };
