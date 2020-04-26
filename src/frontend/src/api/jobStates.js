import runOnce from '../utils/runOnceApi';

export default runOnce(async() => {
    const res = await fetch('/api/v1/jobStates');
    return await res.json();
});
