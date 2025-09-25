// localSyncService.js
// פונקציות לפניה לסרביס הסנכרון המקומי

export async function checkLocalSyncService() {
    try {
        const response = await fetch('http://localhost:5800/test');
        if (!response.ok) throw new Error('Sync service not available');
        const data = await response.json();
        return { available: true, version: data.version };
    } catch (err) {
        return { available: false, version: null };
    }
}

export async function triggerLocalSync() {
    try {
        const response = await fetch('http://localhost:5800/fetch-and-normalize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to trigger sync');
        return await response.json();
    } catch (err) {
        throw err;
    }
}
