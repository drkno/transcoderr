export default async() => {
    const res = await fetch('/api/v1/jobs');
    return await res.json();
};
