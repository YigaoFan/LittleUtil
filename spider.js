"use strict"

const request = require('request')

const log = console.log.bind(console)

const saveJSON = function (path, data) {
	const fs = require('fs')
	const s = JSON.stringify(data, null, 2)
	fs.appendFileSync(path, s)
}

const combineToAnswerLink = function(questionApi, answerApi) {
	// questionApi sample: http://www.zhihu.com/api/v4/questions/305042684
	// answerApi sample: http://www.zhihu.com/api/v4/answers/866317403
	// expect answer link: https://www.zhihu.com/question/305042684/answer/866317403
	var answerLink = 'https://www.zhihu.com/question/'
	var wordItems = questionApi.split('/')
	answerLink += wordItems[wordItems.length - 1]
	answerLink += '/answer/'
	wordItems = answerApi.split('/')
	answerLink += wordItems[wordItems.length - 1]
	return answerLink
}

const Favorite = function() {
	this.title = ''
	this.link = ''
}

const specificFavoritesFromUrl = function(keyword, options, path) {
	request(options, function (error, response, dataStr) {
		if (error === null && response.statusCode == 200) {
			log('--- 请求成功 ')
			const data = JSON.parse(dataStr)
			const favoritesRawData = data.data

			const favorites = []
			for (let i = 0; i < favoritesRawData.length; i++) {
				let element = favoritesRawData[i]
				const f = new Favorite();
				if (false) {
					f.title = element.content
				} else {
					// 判断是否是问题
					if (element.content.question) {
						f.title = element.content.question.title
						const answerApi = element.content.url
						const questionApi = element.content.question.url
						f.link = combineToAnswerLink(questionApi, answerApi)
					} else {
						f.title = element.content.title
						f.link = element.content.url
					}
				}

				favorites.push(f)
			}

			saveJSON(path, favorites)
			log(favorites.length, ' item(s) found')


			if (!data.paging.is_end) {
				options.url = data.paging.next
				specificFavoritesFromUrl(keyword, options, path)
			}
		} else {
			log('*** ERROR 请求失败 ', error)
		}
	})
}

// 爬取知乎收藏夹内容
const __main = function() {
	const path = 'ZhihuFavorites.txt'
	const fs = require('fs')
	if (fs.existsSync(path)) {
		fs.unlink(path, (err) => {
			if (err) {
				log('error', err)
			} else {
				console.log(`${path} 成功删除`)
			}
		})
	}
	
	const cookie = ''
	const useragent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36'
	const headers = {
		'Cookie': cookie,
		'User-Agent': useragent,
	}
	
	const template = 'https://www.zhihu.com/api/v4/favlists/{favoritesId}/items?offset=0&limit=20&include=data%5B*%5D.created%2Ccontent.comment_count%2Csuggest_edit%2Cis_normal%2Cthumbnail_extra_info%2Cthumbnail%2Cdescription%2Ccontent%2Cvoteup_count%2Ccreated%2Cupdated%2Cupvoted_followees%2Cvoting%2Creview_info%2Cis_labeled%2Clabel_info%2Crelationship.is_authorized%2Cvoting%2Cis_author%2Cis_thanked%2Cis_nothelp%2Cis_recognized%3Bdata%5B*%5D.author.badge%5B%3F(type%3Dbest_answerer)%5D.topics'
	const favoritesId = 251615047
	const favoriteStartUrls = [
		template.replace('{favoritesId}', favoritesId),
	]
	
	const options = {
		'url': favoriteStartUrls[0],
		headers: headers,
	}
	const keyword = ''
	
	specificFavoritesFromUrl(keyword, options, path)
}

__main()
