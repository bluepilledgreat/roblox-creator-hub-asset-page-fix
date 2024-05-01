// ==UserScript==
// @name         Fix Roblox Creator Hub asset page
// @version      1.3
// @namespace    https://github.com/bluepilledgreat/roblox-creator-hub-asset-page-fix
// @description  Fixes Roblox Creator Hub (create.roblox.com) not being able to display certain asset types (images, meshes) and off-sale items. Also redirects place ids to www.roblox.com.
// @author       Matt
// @match        https://create.roblox.com/marketplace/asset/*
// @match        https://create.roblox.com/store/asset/*
// @grant        none
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const _fetch = window.fetch
    window.fetch = async (input, options) => {
        const response = await _fetch(input, options)

        try {
            if (!input.includes('/toolbox-service/v1/items/details')) {
                return response;
            }

            let content = await response.text()

            if (response.ok) {
                //return response;
                // for some reason i have to do this or it wont work???
                return new Response(content, {
                    status: content.status,
                    statusText: content.statusText,
                    headers: response.headers,
                    url: response.url
                })
            }

            const assetIdIndex = input.lastIndexOf('=');
            if (assetIdIndex === -1) {
                throw new Error('No asset ID found');
            }

            const assetId = input.substring(assetIdIndex + 1);

            const economyUrl = `https://economy.roblox.com/v2/assets/${assetId}/details`

            let economyResult

            $.ajax({
                url: economyUrl,
                type: 'GET',
                async: false,
                xhrFields: {withCredentials: true},

                success: function(result) {
                    economyResult = result;
                },

                error: function(error) {
                    throw new Error(error);
                }
            })

            const economyData = economyResult; //JSON.parse(economyResult);

            if (economyData.AssetTypeId === 9) {
                window.location.replace(`https://www.roblox.com/games/${assetId}`);
                //window.location.href = `https://www.roblox.com/games/${assetId}`;
            }

            const newContent = {data: [{asset: {}, creator: {}, voting: {}, product: {}}]};
            const d = newContent.data[0];
            const a = d.asset;
            const c = d.creator;
            const v = d.voting;
            const p = d.product;

            a.audioDetails = null;
            a.id = economyData.AssetId;
            a.name = economyData.Name;
            a.typeId = economyData.AssetTypeId;
            a.assetSubTypes = [];
            a.assetGenres = ['All'];
            a.ageGuidelines = null;
            a.isEndorsed = false;
            a.description = economyData.Description;
            a.duration = 0;
            a.hasScripts = false;
            a.createdUtc = economyData.Created;
            a.updatedUtc = economyData.Updated;
            a.creatingUniverseId = null;
            a.isAssetHashApproved = true;
            a.visibilityStatus = null;

            c.id = economyData.Creator.Id;
            c.name = economyData.Creator.Name;
            c.type = economyData.Creator.CreatorType === 'User' ? 1 : 2; // is it 2?
            c.isVerifiedCreator = true; // remove annoying warning
            c.latestGroupUpdaterUserId = null;
            c.latestGroupUpdaterUserName = null;

            // TODO
            v.showVotes = true;
            v.upVotes = 9000;
            v.downVotes = 1;
            v.canVote = false;
            v.userVote = null;
            v.hasVoted = false;
            v.voteCount = 9001;
            v.upVotePercent = 1337;

            p.productId = economyData.ProductId;
            p.price = economyData.PriceInRobux ?? 0;
            p.isForSaleOrIsPublicDomain = economyData.IsForSale || economyData.IsPublicDomain;

            const newContentString = JSON.stringify(newContent);

            return new Response(newContentString, {
                status: 200,
                statusText: 'Found',
                headers: response.headers,
                url: response.url
            })
        } catch (err) {
            console.error(`ERR: ${err.message}`);
        }

        return response;
    }
})();
