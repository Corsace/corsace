import { Mappool } from "../../Models/tournaments/mappools/mappool";
import { buckets } from "../s3";

// Can't think of any other possible use case where we would need to use S3/R2 other than mappacks, but if we do, we can just add more overload functions and cases here.
export function gets3Key(bucket: string, url: string | null | undefined): string | undefined
export function gets3Key(bucket: string, mappool: Mappool): string | undefined
export function gets3Key(bucket: string, obj?: string | null | Mappool): string | undefined {
    // Checks
    let url: string | null | undefined = "";
    if (typeof obj === "string")
        url = obj;
    else if (obj instanceof Mappool && (obj.isPublic || (obj.mappackExpiry?.getTime() ?? -1) > Date.now()))
        url = obj.mappackLink;
    else
        return;

    if (!url)
        return;

    // Get the path, and then get the bucket segment. The key should be the segments after.
    const urlObject = new URL(url);
    const segments = urlObject.pathname.split('/');

    const s3Bucket = buckets[bucket];
    if (!s3Bucket)
        return;

    if (s3Bucket.publicUrl) // public URLs don't contain the bucket name, and the pathname is essentially the key
        return urlObject.pathname.slice(1);
    
    
    const bucketName = s3Bucket.bucketName;
    const bucketIndex = segments.findIndex(segment => segment === bucketName);
    if (bucketIndex === -1)
        return;

    const decodedSegments = segments.slice(bucketIndex + 1).map(segment => decodeURIComponent(segment));
    return decodedSegments.join('/');

    
}