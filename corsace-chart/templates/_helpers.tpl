{{/*
Expand the name of the chart.
*/}}
{{- define "corsace-chart.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "corsace-chart.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "corsace-chart.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "corsace-chart.labels" -}}
helm.sh/chart: {{ include "corsace-chart.chart" . }}
{{ include "corsace-chart.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "corsace-chart.selectorLabels" -}}
app.kubernetes.io/name: {{ include "corsace-chart.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "corsace-chart.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "corsace-chart.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Shared environment by deployments
*/}}
{{- define "corsace-chart.env" -}}
- name: DEPLOYMENT
  value: production
- name: DB_URL
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace-chart.fullname" $ }}
      key: databaseHost
- name: DISCORD_TOKEN
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace-chart.fullname" $ }}
      key: discordToken
- name: DISCORD_CLIENTSECRET
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace-chart.fullname" $ }}
      key: discordClientSecret
- name: OSU_PROXY_BASEURL
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace-chart.fullname" $ }}
      key: osuProxyBaseUrl
- name: OSU_V1_APIKEY
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace-chart.fullname" $ }}
      key: osuv1ApiKey
- name: OSU_V2_CLIENTID
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace-chart.fullname" $ }}
      key: osuv2ClientId
- name: OSU_V2_CLIENTSECRET
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace-chart.fullname" $ }}
      key: osuv2ClientSecret
- name: OSU_BANCHO_USERNAME
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace-chart.fullname" $ }}
      key: osuBanchoUsername
- name: OSU_BANCHO_IRC_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace-chart.fullname" $ }}
      key: osuBanchoIRCPassword
- name: OSU_BANCHO_BOT_ACCOUNT
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace-chart.fullname" $ }}
      key: osuBanchoBotAccount
- name: KOA_KEY
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace-chart.fullname" $ }}
      key: koaKey
- name: INTEROP_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace-chart.fullname" $ }}
      key: interOpPassword
- name: GITHUB_WEBHOOK_SECRET
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace-chart.fullname" $ }}
      key: githubWebhookSecret
- name: GITHUB_WEBHOOK_URL
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace-chart.fullname" $ }}
      key: githubWebhookUrl
- name: BN_USERNAME
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace-chart.fullname" $ }}
      key: bnUsername
- name: BN_SECRET
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace-chart.fullname" $ }}
      key: bnSecret
- name: CLOUDFLARE_R2_HOSTNAME
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace-chart.fullname" $ }}
      key: cloudflareR2Hostname
- name: CLOUDFLARE_R2_ACCESS_KEY_ID
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace-chart.fullname" $ }}
      key: cloudflareR2AccessKeyId
- name: CLOUDFLARE_R2_SECRET_ACCESS_KEY
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace-chart.fullname" $ }}
      key: cloudflareR2SecretAccessKey
- name: CENTRIFUGO_API_KEY
  valueFrom:
    secretKeyRef:
      name: {{ include "corsace-chart.fullname" $ }}
      key: centrifugoApiKey
- name: API_PUBLICURL
  value: {{ default (printf "%s%s%s" "http://" (include "corsace-chart.fullname" $) "-api") $.Values.webServices.api.publicUrl }}
- name: CRONRUNNER_PUBLICURL
  value: {{ default (lower (printf "%s%s%s" "http://" (include "corsace-chart.fullname" $) "-cronRunner")) $.Values.webServices.cronRunner.publicUrl }}
- name: BANCHOBOT_PUBLICURL
  value: {{ default (lower (printf "%s%s%s" "http://" (include "corsace-chart.fullname" $) "-banchoBot")) $.Values.webServices.banchoBot.publicUrl }}
{{- range $webServiceName, $webService := $.Values.webServices }}
{{- if and (ne $webServiceName "api") (ne $webServiceName "cronRunner") (ne $webServiceName "banchoBot") }}
- name: {{ $webServiceName | upper }}_PUBLICURL
  value: {{ $webService.publicUrl }}
- name: {{ $webServiceName | upper }}_SSR
  value: "{{ $webService.ssr }}"
{{- end }}
{{- end }}
{{- end }}
