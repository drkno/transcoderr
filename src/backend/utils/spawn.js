const { spawn } = require('child_process');
const EventEmitter = require('events');

class ChildProcess extends EventEmitter {
    constructor(command, args = [], options = {}) {
        super();

        this._onStdOut = this._onStdOut.bind(this);
        this._onStdErr = this._onStdErr.bind(this);
        this._onClose = this._onClose.bind(this);
        this._process = this._spawn(command, args, Object.assign({
            stdio: ['pipe', 'pipe', 'pipe']
        }, options));

        this._stdout = '';
        this._stderr = '';
        this._code = -1;

        this._promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }

    async getStdOut() {
        await this._promise;
        return this._stdout;
    }

    async getStdErr() {
        await this._promise;
        return this._stderr;
    }

    async getExitCode() {
        await this._promise;
        return this._code;
    }

    kill(signal) {
        return this._process.kill(signal);
    }

    _spawn(command, args, options) {
        const cmd = spawn(command, args, options);
        cmd.stdout.on('data', this._onStdOut);
        cmd.stderr.on('data', this._onStdErr);
        cmd.on('close', this._onClose);
        return cmd;
    }

    _onStdOut(data) {
        const dataStr = data.toString('utf-8');
        this.emit('stdout', dataStr);
        this._stdout += dataStr;
    }

    _onStdErr(data) {
        const dataStr = data.toString('utf-8');
        this.emit('stderr', dataStr);
        this._stderr += dataStr;
    }

    _onClose(code) {
        this._code = code;
        const result = {
            code: this._code,
            stdout: this._stdout,
            stderr: this._stderr
        };
        this._resolve(result);
        this.emit('close', result);
    }

    _onError(err) {
        this.emit('err', err);
        this._reject(err);
    }
}

module.exports = ChildProcess;
